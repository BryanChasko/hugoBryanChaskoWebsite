variable "domain" {
  description = "Domain name for CloudFront aliases"
  type        = string
}

variable "s3_bucket_regional_domain" {
  description = "S3 bucket regional domain name"
  type        = string
}

variable "s3_bucket_id" {
  description = "S3 bucket ID"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1)"
  type        = string
}
