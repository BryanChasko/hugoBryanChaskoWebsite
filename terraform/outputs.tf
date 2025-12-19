output "s3_bucket_name" {
  description = "Production S3 bucket name"
  value       = module.s3.production_bucket_name
}

output "s3_baseline_bucket_name" {
  description = "Test baseline S3 bucket name"
  value       = module.s3.baseline_bucket_name
}

output "terraform_state_bucket_name" {
  description = "S3 bucket used to store Terraform state"
  value       = var.terraform_state_bucket_name
}

output "terraform_state_lock_table_name" {
  description = "DynamoDB table used for Terraform state locking"
  value       = var.terraform_state_lock_table_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (sensitive)"
  value       = module.cloudfront.distribution_id
  sensitive   = true
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.distribution_domain_name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = module.route53.zone_id
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN (us-east-1)"
  value       = module.acm.certificate_arn
}

output "iam_user_arn" {
  description = "IAM user ARN for GitHub Actions"
  value       = module.iam.user_arn
}

output "github_oidc_role_arn" {
  description = "IAM role ARN assumed by GitHub Actions for Terraform jobs"
  value       = aws_iam_role.github_actions_terraform.arn
}

output "parameter_store_namespace" {
  description = "SSM Parameter Store namespace"
  value       = var.parameter_store_namespace
}
