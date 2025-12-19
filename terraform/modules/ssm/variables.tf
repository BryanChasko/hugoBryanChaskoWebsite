variable "namespace" {
  description = "SSM Parameter Store namespace (e.g., /sites/bryanchasko.com)"
  type        = string
}

variable "s3_bucket_name" {
  description = "Production S3 bucket name"
  type        = string
}

variable "domain" {
  description = "Site domain name"
  type        = string
}

variable "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}
