/**
 * S3 Baseline Manager for WebGL Visual Regression Testing
 * 
 * Manages screenshot baselines in S3 bucket with PNG minification.
 * Auto-updates baselines on main branch, compares against stored baselines on PRs.
 */

const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { fromIni } = require('@aws-sdk/credential-providers');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class BaselineManager {
  constructor(options = {}) {
    this.bucketName = options.bucketName || 'bryanchasko-com-webgl-baselines';
    this.region = options.region || 'us-west-2';
    this.localCacheDir = options.localCacheDir || path.join(__dirname, '../.baselines');
    
    // Update baselines if:
    // 1. Explicitly requested via UPDATE_BASELINES=true
    // 2. On main branch in CI (GitHub Actions)
    // 3. Local development with valid AWS credentials (always allow regression testing)
    const isCI = !!process.env.GITHUB_REF;
    const isMainBranch = process.env.GITHUB_REF === 'refs/heads/main';
    const hasAWSCredentials = !!process.env.AWS_ACCESS_KEY_ID || !!process.env.HOME;
    
    this.updateBaselines = process.env.UPDATE_BASELINES === 'true' || 
                          (isCI && isMainBranch) ||
                          (!isCI && hasAWSCredentials); // Allow local dev to update baselines
    
    // Initialize S3 client with credential chain
    // Try profile first (for local dev), then env vars, then default
    const profile = process.env.AWS_PROFILE || 'aerospaceug-admin';
    const s3Config = {
      region: this.region,
    };
    
    // Use fromIni to load credentials from ~/.aws/credentials with specified profile
    // This works for local development
    if (!process.env.AWS_ACCESS_KEY_ID && !process.env.GITHUB_ACTIONS) {
      s3Config.credentials = fromIni({ profile });
    }
    
    this.s3Client = new S3Client(s3Config);
    
    // Ensure local cache directory exists
    this._ensureCacheDir();
  }
  
  async _ensureCacheDir() {
    try {
      await fs.mkdir(this.localCacheDir, { recursive: true });
    } catch (err) {
      console.warn(`Warning: Could not create cache directory: ${err.message}`);
    }
  }
  
  /**
   * Minify PNG using pngquant for optimal S3 storage
   * @param {Buffer} imageBuffer - Original PNG buffer
   * @returns {Promise<Buffer>} - Minified PNG buffer
   */
  async minifyPng(imageBuffer) {
    try {
      // Use sharp for PNG optimization (80% quality, preserves transparency)
      const minified = await sharp(imageBuffer)
        .png({ 
          quality: 80, 
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: true
        })
        .toBuffer();
      
      const originalSize = imageBuffer.length;
      const minifiedSize = minified.length;
      const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
      
      console.log(`  PNG minification: ${originalSize} → ${minifiedSize} bytes (${savings}% reduction)`);
      
      return minified;
    } catch (err) {
      console.warn(`  PNG minification failed, using original: ${err.message}`);
      return imageBuffer;
    }
  }
  
  /**
   * Generate S3 key for a test baseline
   * @param {string} testName - Test identifier (e.g., "orbit-scene-chrome")
   * @param {string} browser - Browser name
   * @returns {string} - S3 object key
   */
  getBaselineKey(testName, browser) {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `baselines/${browser}/${testName}-${timestamp}.png`;
  }
  
  /**
   * Get latest baseline key for a test (ignoring timestamp)
   * @param {string} testName - Test identifier
   * @param {string} browser - Browser name
   * @returns {string} - S3 object key prefix
   */
  getLatestBaselineKey(testName, browser) {
    return `baselines/${browser}/${testName}`;
  }
  
  /**
   * Upload baseline screenshot to S3
   * @param {string} testName - Test identifier
   * @param {string} browser - Browser name
   * @param {Buffer} screenshotBuffer - Screenshot PNG buffer
   * @returns {Promise<string>} - S3 object key
   */
  async uploadBaseline(testName, browser, screenshotBuffer) {
    const minified = await this.minifyPng(screenshotBuffer);
    const key = this.getBaselineKey(testName, browser);
    
    console.log(`  Uploading baseline to s3://${this.bucketName}/${key}`);
    
    try {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: minified,
        ContentType: 'image/png',
        Metadata: {
          testName,
          browser,
          timestamp: new Date().toISOString(),
          originalSize: String(screenshotBuffer.length),
          minifiedSize: String(minified.length),
        }
      }));
      
      console.log(`  ✓ Baseline uploaded successfully`);
      return key;
    } catch (err) {
      console.warn(`  ⚠️  Failed to upload baseline (ignoring): ${err.message}`);
      // Do not throw, just continue
      return null;
    }
  }
  
  /**
   * Download baseline from S3 (with local caching)
   * @param {string} testName - Test identifier
   * @param {string} browser - Browser name
   * @returns {Promise<Buffer|null>} - Baseline PNG buffer or null if not found
   */
  async downloadBaseline(testName, browser) {
    const cacheFile = path.join(this.localCacheDir, `${browser}-${testName}.png`);
    
    // Check local cache first
    try {
      const cached = await fs.readFile(cacheFile);
      console.log(`  Using cached baseline from ${cacheFile}`);
      return cached;
    } catch (err) {
      // Cache miss, fetch from S3
    }
    
    // List objects to find latest baseline (S3 doesn't support wildcards)
    const keyPrefix = this.getLatestBaselineKey(testName, browser);
    
    try {
      // Try to fetch the most recent baseline by convention
      // In production, you'd list objects and sort by timestamp
      const key = `${keyPrefix}-latest.png`;
      
      const response = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));
      
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      
      // Cache locally
      await fs.writeFile(cacheFile, buffer);
      console.log(`  Downloaded baseline from s3://${this.bucketName}/${key}`);
      
      return buffer;
    } catch (err) {
      if (err.name === 'NoSuchKey') {
        console.log(`  No baseline found in S3 for ${testName} (${browser})`);
        return null;
      }
      console.warn(`  ⚠️  Error downloading baseline (ignoring): ${err.message}`);
      return null;
    }
  }
  
  /**
   * Compare two images and generate diff
   * @param {Buffer} actual - Actual screenshot buffer
   * @param {Buffer} baseline - Baseline screenshot buffer
   * @param {number} threshold - Pixel difference tolerance (0-1, default 0.05 = 5%)
   * @returns {Promise<{match: boolean, diffPixels: number, diffPercent: number, diffImage?: Buffer}>}
   */
  async compareImages(actual, baseline, threshold = 0.05) {
    try {
      const actualImage = sharp(actual);
      const baselineImage = sharp(baseline);
      
      const actualMeta = await actualImage.metadata();
      const baselineMeta = await baselineImage.metadata();
      
      // Check dimensions match
      if (actualMeta.width !== baselineMeta.width || actualMeta.height !== baselineMeta.height) {
        console.warn(`  Dimension mismatch: actual ${actualMeta.width}x${actualMeta.height} vs baseline ${baselineMeta.width}x${baselineMeta.height}`);
        return {
          match: false,
          diffPixels: actualMeta.width * actualMeta.height,
          diffPercent: 100,
        };
      }
      
      // Get raw pixel data
      const actualData = await actualImage.raw().toBuffer();
      const baselineData = await baselineImage.raw().toBuffer();
      
      // Count differing pixels (simple RGBA comparison)
      let diffPixels = 0;
      const totalPixels = actualMeta.width * actualMeta.height;
      
      for (let i = 0; i < actualData.length; i += 4) {
        const rDiff = Math.abs(actualData[i] - baselineData[i]);
        const gDiff = Math.abs(actualData[i + 1] - baselineData[i + 1]);
        const bDiff = Math.abs(actualData[i + 2] - baselineData[i + 2]);
        const aDiff = Math.abs(actualData[i + 3] - baselineData[i + 3]);
        
        // Consider pixel different if any channel differs by >10
        if (rDiff > 10 || gDiff > 10 || bDiff > 10 || aDiff > 10) {
          diffPixels++;
        }
      }
      
      const diffPercent = (diffPixels / totalPixels) * 100;
      const match = diffPercent <= (threshold * 100);
      
      console.log(`  Image comparison: ${diffPixels} pixels differ (${diffPercent.toFixed(2)}%), threshold: ${threshold * 100}%`);
      
      return {
        match,
        diffPixels,
        diffPercent,
      };
    } catch (err) {
      console.error(`  Image comparison failed: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Clear local cache
   */
  async clearCache() {
    try {
      const files = await fs.readdir(this.localCacheDir);
      await Promise.all(files.map(f => fs.unlink(path.join(this.localCacheDir, f))));
      console.log(`Cleared ${files.length} cached baselines`);
    } catch (err) {
      console.warn(`Failed to clear cache: ${err.message}`);
    }
  }
}

module.exports = BaselineManager;
