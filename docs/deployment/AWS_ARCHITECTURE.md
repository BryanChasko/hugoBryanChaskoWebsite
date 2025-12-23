# AWS Architecture: CloudFront + Origin Access Control + S3

## Overview

This site is deployed on a highly secure, modern AWS architecture using CloudFront for CDN distribution and Origin Access Control (OAC) for private S3 bucket access. No direct public S3 URLs exist.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                            │
│                  https://bryanchasko.com                         │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS Request
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Route 53 DNS                                 │
│           (Domain: bryanchasko.com)                              │
│           Resolves to: CloudFront ([your-actual-distribution-id])              │
└────────────────────────┬────────────────────────────────────────┘
                         │ Route via Edge Location
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              CloudFront Distribution                              │
│          Distribution ID: [your-actual-distribution-id]                         │
│      ┌──────────────────────────────────┐                        │
│      │  Alias: bryanchasko.com          │                        │
│      │  SSL/TLS: ACM Certificate        │                        │
│      │  Protocol: HTTPS only            │                        │
│      │  Cache: By default               │                        │
│      │  Compress: On (gzip, brotli)     │                        │
│      └──────────────────────────────────┘                        │
│                                                                   │
│  Origin Configuration:                                           │
│  ┌──────────────────────────────────────────┐                   │
│  │ Origin: S3 Regional Endpoint             │                   │
│  │ Domain: bryanchasko.com.s3.us-west-2... │                   │
│  │ Type: S3 (NOT Website Endpoint)          │                   │
│  │ Authentication: Origin Access Control    │                   │
│  │ OAC ID: [YOUR-OAC-ID]                  │                   │
│  │ Protocol: HTTPS                         │                   │
│  └──────────────────────────────────────────┘                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ SigV4 Signed Request
                         │ (OAC Authentication)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Amazon S3 Bucket                                 │
│            Bucket: bryanchasko.com                               │
│            Region: us-west-2 (Oregon)                            │
│                                                                   │
│  ┌─────────────────────────────────────────┐                    │
│  │  Public Access Block: ENABLED (all 4)   │  ← NO Public URLs  │
│  │  ├─ BlockPublicAcls: true              │                    │
│  │  ├─ IgnorePublicAcls: true             │                    │
│  │  ├─ BlockPublicPolicy: true            │                    │
│  │  └─ RestrictPublicBuckets: true        │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                   │
│  ┌─────────────────────────────────────────┐                    │
│  │  Bucket Policy:                          │                    │
│  │  ├─ Principal: cloudfront.amazonaws.com │                    │
│  │  ├─ Action: s3:GetObject                │                    │
│  │  ├─ Resource: bryanchasko.com/*         │                    │
│  │  └─ Condition: OAC SigV4 Signature      │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                   │
│  ┌─────────────────────────────────────────┐                    │
│  │  Versioning: ENABLED                    │                    │
│  │  (Automatic rollback capability)        │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                   │
│  Static Files:                                                   │
│  ├─ index.html (22 KB, HTML)               │                    │
│  ├─ assets/css/stylesheet.*.css (250 KB)   │                    │
│  ├─ assets/js/bundle.*.js (500 KB)         │                    │
│  ├─ blog/posts/*/index.html (various)      │                    │
│  └─ ... (entire public/ directory)         │                    │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Route 53 (DNS)

**Purpose:** Route domain `bryanchasko.com` to CloudFront

**Configuration:**
- Type: ALIAS record
- Name: `bryanchasko.com`
- Target: CloudFront distribution `[your-actual-distribution-id]`
- Evaluate Target Health: No

**Why ALIAS (not CNAME)?**
- Works with root domain (CNAME cannot be used at root)
- CloudFront edge locations distribute globally
- No additional latency

### 2. CloudFront Distribution

**Purpose:** Global CDN layer for fast content delivery

**Distribution ID:** `[your-actual-distribution-id]`

**Key Settings:**

| Setting | Value | Why |
|---------|-------|-----|
| **Origins** | S3 Regional Endpoint | Direct S3 object access, better performance than website endpoint |
| **Origin Access Control** | [YOUR-OAC-ID] (SigV4) | Private bucket access; OAC signs requests with AWS Signature Version 4 |
| **Default Root Object** | index.html | Serves index.html when user requests `/` |
| **Cache Behavior** | CloudFront Managed Policy | Compress with gzip/brotli; cache static assets |
| **Minimum TTL** | 0 seconds | Allow short-lived content |
| **Default TTL** | 86400 seconds (1 day) | Cache static assets for 24 hours |
| **Maximum TTL** | 31536000 seconds (1 year) | Maximum cache duration |
| **Compress** | Enabled | Reduce bandwidth with gzip/brotli |
| **IPv6** | Enabled | Support modern clients |
| **HTTP/2** | Enabled | Faster multiplexed requests |
| **HTTPS** | ACM Certificate (sni-only) | TLSv1.2+ encryption |

### 3. Origin Access Control (OAC)

**Purpose:** Authenticate CloudFront requests to S3 without public bucket access

**OAC ID:** `[YOUR-OAC-ID]`

**How It Works:**

1. **Request Signing:** When CloudFront requests an object from S3, it signs the request using AWS Signature Version 4 (SigV4)
2. **S3 Validation:** S3 receives the signed request and validates the signature against the bucket policy
3. **Access Grant:** If signature is valid (signed by the OAC principal), S3 returns the object
4. **Cache:** CloudFront caches the object for subsequent requests

**Why OAC Instead of OAI?**
- OAI (Origin Access Identity) is legacy
- OAC is modern, more flexible, supports role-based access
- Supports both S3 and custom origins
- Better logging and auditing

### 4. S3 Bucket

**Name:** `bryanchasko.com`

**Region:** `us-west-2` (Oregon)

**Access Control:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAC",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bryanchasko.com/*"
    }
  ]
}
```

**Why This Policy?**
- Grants only CloudFront service permission to GetObject (read files)
- OAC authentication enforced via SigV4 signing
- No PutObject, DeleteObject, or other modifying actions allowed
- No direct public access possible

**Block Public Access (All Enabled):**
```
- BlockPublicAcls: true
- IgnorePublicAcls: true  
- BlockPublicPolicy: true
- RestrictPublicBuckets: true
```

These settings prevent:
- ❌ Direct S3 object URLs: `https://bryanchasko.com.s3.amazonaws.com/index.html`
- ❌ Public ACLs on objects
- ❌ Public bucket policies
- ✅ Only CloudFront can access via OAC

**Versioning:** ENABLED

Automatic rollback: If you need to revert to a previous version, S3 keeps version history.

### 5. ACM Certificate

**Domain:** `bryanchasko.com`

**Issued By:** AWS Certificate Manager (free)

**SSL/TLS Settings:**
- Protocol: TLSv1.2+ (enforce)
- SNI (Server Name Indication): Required
- Renewal: Automatic (via ACM)

**Why SNI?**
- Allows multiple domains per IP address
- Reduces CloudFront IP addressing complexity
- Industry standard since 2010

### 6. CloudFront Functions

**Purpose:** Execute lightweight logic at the edge (viewer-request stage) without Lambda overhead

**Current Functions:**

| Function | Stage | Purpose | Trigger | Source |
|----------|-------|---------|---------|--------|
| `bryanchasko-com-url-rewrite` | LIVE | URL rewriting + redirects | viewer-request | [`infrastructure/cloudfront-url-rewrite-function.js`](../../infrastructure/cloudfront-url-rewrite-function.js) |

**URL Rewrite Function Logic:**
```javascript
function handler(event) {
    var request = event.request;
    var uri = request.uri.toLowerCase();
    
    // Redirect /help to /services (case-insensitive)
    if (uri === '/help' || uri === '/help/') {
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                'location': { value: '/services' }
            }
        };
    }
    
    // URL rewriting for SPA routing
    if (!uri.includes('.') && !uri.endsWith('/')) {
        request.uri = uri + '/index.html';
    }
    else if (uri.endsWith('/') && !uri.endsWith('/index.html')) {
        request.uri = uri + 'index.html';
    }
    
    return request;
}
```

**Why CloudFront Functions?**
- ✅ Executes at edge (low latency)
- ✅ No cold starts (unlike Lambda@Edge)
- ✅ Cheaper than Lambda@Edge (~$0.60/month vs $0.50 per 1M requests)
- ✅ Handles redirects without S3 objects
- ✅ Case-insensitive URL matching

**Deployment:**
```bash
# Update function code
aws cloudfront update-function \
  --name bryanchasko-com-url-rewrite \
  --function-code fileb://./function.js \
  --function-config Comment="URL rewriting and redirects",Runtime=cloudfront-js-1.0 \
  --if-match [ETAG] \
  --profile websites-bryanchasko

# Publish to LIVE
aws cloudfront publish-function \
  --name bryanchasko-com-url-rewrite \
  --if-match [NEW-ETAG] \
  --profile websites-bryanchasko
```

### 7. Deployment Endpoints

**Development Server:**
```
http://localhost:1313/
```

**Staging (if used):**
```
https://staging.bryanchasko.com/  (can set up separate CloudFront + S3 + Route 53)
```

**Production:**
```
https://bryanchasko.com/
```

## Data Flow: Request → Response

### Step 1: DNS Resolution
```
User types: https://bryanchasko.com/
Browser queries: Route 53
Response: CloudFront distribution IP (global)
```

### Step 2: TLS Handshake
```
Browser: TLS ClientHello (wants bryanchasko.com)
CloudFront: Returns ACM cert for bryanchasko.com
Browser: Verifies cert (valid, trusted)
Result: HTTPS established ✅
```

### Step 3: HTTP Request
```
Browser sends: GET /index.html HTTP/2
CloudFront edge location checks local cache
```

### Step 4: Cache Hit / Cache Miss

**Cache Hit (fast):**
```
CloudFront cache: Has index.html (age < 24 hours)
Result: Return to browser instantly (Age: <24h)
```

**Cache Miss (slower):**
```
CloudFront cache: Empty or expired
CloudFront: Create SigV4 signed request
CloudFront: Send to S3 regional endpoint
S3: Validate signature (OAC)
S3: Return index.html
CloudFront: Cache object (24 hours)
CloudFront: Return to browser
```

### Step 5: Browser Caches Locally
```
Browser checks Cache-Control header
Stores in local cache (browser-controlled TTL)
Subsequent refresh: Checks local cache first
```

### Step 6: Cache Invalidation (After Deployment)

When you deploy new code, invalidate CloudFront cache:

```bash
perl scripts/deploy.pl --profile websites-bryanchasko
```

This triggers:
```
CloudFront: Remove all cached objects (/* path)
Next request: CloudFront → S3 (get latest)
User: Gets new version within 1-2 minutes
```

## Security Guarantees

| Threat | Mitigation | Status |
|--------|-----------|--------|
| **Public S3 bucket leak** | Block Public Access (all 4 enabled) | ✅ Prevented |
| **Direct S3 URL access** | Bucket policy: only CloudFront allowed | ✅ Prevented |
| **Unencrypted traffic** | HTTPS enforced, HTTP → HTTPS redirect | ✅ Prevented |
| **Expired SSL cert** | ACM auto-renewal (30 days before expiry) | ✅ Automated |
| **HTTP/1.0 only clients** | CloudFront enforces HTTP/2 minimum | ✅ Enforced |
| **Weak TLS versions** | ACM enforces TLSv1.2+ (no SSL 3.0, TLS 1.0) | ✅ Enforced |
| **DDoS attacks** | CloudFront includes DDoS protection | ✅ Automatic |
| **Unauthorized S3 access** | OAC SigV4 signing validates every request | ✅ Signed |

## Cost Analysis

**Monthly Costs (Typical):**

| Service | Volume | Price | Monthly Cost |
|---------|--------|-------|--------------|
| **S3 Storage** | 50 MB | $0.023/GB | $0.001 |
| **CloudFront Data Out** | 10 GB/month | $0.085/GB | $0.85 |
| **Route 53** | 1 hosted zone | $0.50/month | $0.50 |
| **ACM Cert** | 1 cert | Free | $0.00 |
| **CloudFront Requests** | 100K/month | $0.0075/10K | $0.075 |
| **TOTAL** | | | **~$1.50/month** |

**Cost Optimization:**
- ✅ Free S3 tier not used (50 MB < 1 GB)
- ✅ CloudFront caches aggressively (reduces data transfer)
- ✅ Regional S3 endpoint (no cross-region replication costs)
- ✅ Static content (no compute, database, or Lambda costs)

## Deployment Architecture

```
Developer Local
    │
    ├─→ git push origin feature/fix
    │   └─→ GitHub (Pull Request)
    │       └─→ [Human Review] ✓
    │           └─→ Merge to main
    │
    ├─→ perl scripts/deploy.pl
    │   ├─→ [1] Hugo Build (hugo --minify)
    │   │   └─→ Generates: public/
    │   │
    │   ├─→ [2] WebGL Tests (npm test)
    │   │   └─→ Validates visual regression, performance
    │   │
    │   ├─→ [3] S3 Sync (aws s3 sync public/ s3://bryanchasko.com)
    │   │   └─→ Uploads changed files
    │   │
    │   ├─→ [4] Wait 5 seconds (S3 eventual consistency)
    │   │
    │   ├─→ [5] CloudFront Invalidation (/* path)
    │   │   └─→ Clears CDN cache (1-2 minutes)
    │   │
    │   └─→ [6] Baseline Update (npm run test:update-baselines)
    │       └─→ Update visual regression baselines
    │
    └─→ Browser: https://bryanchasko.com/
        ├─→ 200 OK + new content
        └─→ Cached in CloudFront for 24 hours
```

## Monitoring & Maintenance

### CloudFront Cache Invalidation Status
```bash
aws cloudfront list-invalidations --distribution-id [your-actual-distribution-id] --profile websites-bryanchasko
```

### S3 Bucket Size
```bash
aws s3 ls s3://bryanchasko.com/ --recursive --profile websites-bryanchasko | tail -1
```

### CloudFront Request Metrics
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name BytesDownloaded \
  --dimensions Name=DistributionId,Value=[your-actual-distribution-id] \
  --start-time 2024-12-01T00:00:00Z \
  --end-time 2024-12-31T23:59:59Z \
  --period 86400 \
  --statistics Sum \
  --profile websites-bryanchasko
```

### Verify OAC Configuration
```bash
# Get OAC ID from .secrets-reference.json
aws cloudfront get-origin-access-control --id [YOUR-OAC-ID] --profile [YOUR-AWS-PROFILE]
```

### Check Bucket Policy
```bash
aws s3api get-bucket-policy --bucket bryanchasko.com --profile websites-bryanchasko | jq .
```

## Troubleshooting

### Issue: Site Returns 403 Forbidden

**Diagnosis:**
```bash
curl -v https://bryanchasko.com/
# Check: <Code>AccessDenied</Code>
```

**Root Causes & Fixes:**

1. **OAC Not Configured on Origin**
   ```bash
   # Check if CloudFront has OAC
   aws cloudfront get-distribution-config --id [your-actual-distribution-id] --profile websites-bryanchasko \
     | jq '.DistributionConfig.Origins.Items[0].OriginAccessControlId'
   
   # Should return: "[YOUR-OAC-ID]"
   ```

2. **Bucket Policy Missing OAC**
   ```bash
   # Get current policy
   aws s3api get-bucket-policy --bucket bryanchasko.com --profile websites-bryanchasko | jq .
   
   # Policy must have: "Principal": {"Service": "cloudfront.amazonaws.com"}
   ```

3. **Wrong S3 Endpoint**
   ```bash
   # Should be REGIONAL: bryanchasko.com.s3.us-west-2.amazonaws.com
   # NOT website: bryanchasko.com.s3-website-us-west-2.amazonaws.com
   
   aws cloudfront get-distribution-config --id [your-actual-distribution-id] --profile websites-bryanchasko \
     | jq '.DistributionConfig.Origins.Items[0].DomainName'
   ```

### Issue: Cache Not Updating After Deploy

**Check Invalidation Status:**
```bash
aws cloudfront list-invalidations --distribution-id [your-actual-distribution-id] --profile websites-bryanchasko \
  | jq '.InvalidationList.Items[0] | {Status, CreateTime}'

# Status should be: Completed (takes 1-2 minutes)
```

**Force Browser Refresh:**
```
macOS: Cmd + Shift + R
Windows/Linux: Ctrl + Shift + R
```

### Issue: SSL Certificate Error

**Check Certificate:**
```bash
aws acm describe-certificate \
  --certificate-arn $(aws acm list-certificates --query 'CertificateSummaryList[?DomainName==`bryanchasko.com`].CertificateArn' --output text --profile websites-bryanchasko) \
  --profile websites-bryanchasko | jq '.Certificate | {DomainName, Status, NotAfter}'
```

**Auto-Renewal:** ACM automatically renews 30 days before expiration.

## References

- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [CloudFront + Origin Access Control (OAC)](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [S3 Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)
- [CloudFront Cache Invalidation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html)
- [AWS Signature Version 4](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html)
