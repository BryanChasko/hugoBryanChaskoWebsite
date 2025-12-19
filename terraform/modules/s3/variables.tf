variable "domain" {
  description = "Domain name for bucket naming"
  type        = string
}

variable "baseline_lifecycle_days" {
  description = "Days to retain old baseline versions"
  type        = number
  default     = 180
}

variable "cloudfront_oac_iam_arn" {
  description = "CloudFront Origin Access Control IAM ARN for bucket policy"
  type        = string
}
