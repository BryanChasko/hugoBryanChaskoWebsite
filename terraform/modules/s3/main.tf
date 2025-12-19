# Production S3 Bucket
resource "aws_s3_bucket" "production" {
  bucket = var.domain
}

resource "aws_s3_bucket_versioning" "production" {
  bucket = aws_s3_bucket.production.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "production" {
  bucket = aws_s3_bucket.production.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy for CloudFront OAC access
resource "aws_s3_bucket_policy" "production" {
  bucket = aws_s3_bucket.production.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.production.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = var.cloudfront_oac_iam_arn
          }
        }
      }
    ]
  })
}

# Test Baseline S3 Bucket
resource "aws_s3_bucket" "baselines" {
  bucket = "${var.domain}-webgl-baselines"
}

resource "aws_s3_bucket_versioning" "baselines" {
  bucket = aws_s3_bucket.baselines.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "baselines" {
  bucket = aws_s3_bucket.baselines.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "baselines" {
  bucket = aws_s3_bucket.baselines.id

  rule {
    id     = "DeleteOldVersions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = var.baseline_lifecycle_days
    }

    expiration {
      days = var.baseline_lifecycle_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "baselines" {
  bucket = aws_s3_bucket.baselines.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
