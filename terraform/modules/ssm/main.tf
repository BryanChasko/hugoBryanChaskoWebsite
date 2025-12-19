# SSM Parameter: S3 Bucket Name
resource "aws_ssm_parameter" "s3_bucket" {
  name      = "${var.namespace}/s3_bucket"
  type      = "String"
  value     = var.s3_bucket_name
  overwrite = true

  description = "Production S3 bucket name"

  tags = {
    ManagedBy = "Terraform"
  }
}

# SSM Parameter: Domain
resource "aws_ssm_parameter" "domain" {
  name      = "${var.namespace}/domain"
  type      = "String"
  value     = var.domain
  overwrite = true

  description = "Site domain name"

  tags = {
    ManagedBy = "Terraform"
  }
}

# SSM Parameter: CloudFront Distribution ID (Sensitive)
resource "aws_ssm_parameter" "cloudfront_distribution_id" {
  name      = "${var.namespace}/cloudfront_distribution_id"
  type      = "String"
  value     = var.cloudfront_distribution_id
  overwrite = true

  description = "CloudFront distribution ID (sensitive)"

  tags = {
    ManagedBy = "Terraform"
    Sensitive = "true"
  }
}

# SSM Parameter: AWS Region
resource "aws_ssm_parameter" "aws_region" {
  name      = "${var.namespace}/aws_region"
  type      = "String"
  value     = var.aws_region
  overwrite = true

  description = "AWS region for resources"

  tags = {
    ManagedBy = "Terraform"
  }
}
