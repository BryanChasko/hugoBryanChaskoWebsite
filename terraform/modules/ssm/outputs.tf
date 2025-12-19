output "parameter_names" {
  description = "List of SSM parameter names"
  value = [
    aws_ssm_parameter.s3_bucket.name,
    aws_ssm_parameter.domain.name,
    aws_ssm_parameter.cloudfront_distribution_id.name,
    aws_ssm_parameter.aws_region.name
  ]
}

output "namespace" {
  description = "SSM Parameter Store namespace"
  value       = var.namespace
}
