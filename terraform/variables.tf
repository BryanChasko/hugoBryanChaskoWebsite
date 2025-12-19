variable "domain" {
  description = "Primary domain name for the site"
  type        = string
  default     = "bryanchasko.com"
}

variable "aws_region" {
  description = "AWS region for primary resources"
  type        = string
  default     = "us-west-2"
}

variable "aws_account_id" {
  description = "AWS account ID (automatically detected)"
  type        = string
  default     = ""
}

variable "parameter_store_namespace" {
  description = "SSM Parameter Store namespace for configuration"
  type        = string
  default     = "/sites/bryanchasko.com"
}

variable "baseline_bucket_lifecycle_days" {
  description = "Number of days to retain old baseline versions"
  type        = number
  default     = 180
}

variable "iam_user_name" {
  description = "IAM user for GitHub Actions"
  type        = string
  default     = "github-actions-webgl-tests"
}

variable "terraform_state_bucket_name" {
  description = "S3 bucket used for storing Terraform state files"
  type        = string
  default     = "bryanchasko-terraform-state"
}

variable "terraform_state_lock_table_name" {
  description = "DynamoDB table name for Terraform state locking"
  type        = string
  default     = "bryanchasko-terraform-lock"
}

variable "github_repository" {
  description = "GitHub repository used for OpenID Connect subject matching"
  type        = string
  default     = "BryanChasko/bryan-chasko-com"
}

variable "github_oidc_provider_url" {
  description = "OIDC provider URL for GitHub Actions"
  type        = string
  default     = "https://token.actions.githubusercontent.com"
}

variable "github_oidc_client_id" {
  description = "OIDC client identifier used when configuring IAM role trust"
  type        = string
  default     = "sts.amazonaws.com"
}

variable "github_oidc_thumbprint" {
  description = "Certificate thumbprint for GitHub Actions OIDC provider"
  type        = string
  default     = "6938fd4d98bab03faadb97b34396831e3780aea1"
}

variable "github_oidc_subject" {
  description = "OIDC subject pattern (repo and environment) allowed to assume the role"
  type        = string
  default     = "repo:bryanchasko/bryan-chasko-com:*"
}
