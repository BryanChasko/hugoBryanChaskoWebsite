variable "iam_user_name" {
  description = "IAM user name for GitHub Actions"
  type        = string
}

variable "production_bucket_arn" {
  description = "Production S3 bucket ARN"
  type        = string
}

variable "baseline_bucket_arn" {
  description = "Baseline S3 bucket ARN"
  type        = string
}

variable "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  type        = string
}

variable "state_bucket_arn" {
  description = "S3 bucket ARN used for Terraform state"
  type        = string
}

variable "state_lock_table_arn" {
  description = "DynamoDB table ARN used for Terraform state locking"
  type        = string
}
