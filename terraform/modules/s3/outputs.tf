output "production_bucket_id" {
  description = "Production S3 bucket ID"
  value       = aws_s3_bucket.production.id
}

output "production_bucket_name" {
  description = "Production S3 bucket name"
  value       = aws_s3_bucket.production.bucket
}

output "production_bucket_arn" {
  description = "Production S3 bucket ARN"
  value       = aws_s3_bucket.production.arn
}

output "production_bucket_regional_domain_name" {
  description = "Production S3 bucket regional domain name"
  value       = aws_s3_bucket.production.bucket_regional_domain_name
}

output "baseline_bucket_id" {
  description = "Baseline S3 bucket ID"
  value       = aws_s3_bucket.baselines.id
}

output "baseline_bucket_name" {
  description = "Baseline S3 bucket name"
  value       = aws_s3_bucket.baselines.bucket
}

output "baseline_bucket_arn" {
  description = "Baseline S3 bucket ARN"
  value       = aws_s3_bucket.baselines.arn
}
