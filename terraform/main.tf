# AWS Provider Configuration
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "bryanchasko-com"
      ManagedBy   = "Terraform"
      Environment = "production"
    }
  }
}

# AWS Provider for us-east-1 (required for CloudFront ACM certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Project     = "bryanchasko-com"
      ManagedBy   = "Terraform"
      Environment = "production"
    }
  }
}

# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}

# S3 Buckets Module (production + baselines)
module "s3" {
  source = "./modules/s3"
  
  domain                      = var.domain
  baseline_lifecycle_days     = var.baseline_bucket_lifecycle_days
  cloudfront_oac_iam_arn      = module.cloudfront.oac_iam_arn
}

# CloudFront Distribution Module
module "cloudfront" {
  source = "./modules/cloudfront"
  
  domain                 = var.domain
  s3_bucket_regional_domain = module.s3.production_bucket_regional_domain_name
  s3_bucket_id           = module.s3.production_bucket_id
  acm_certificate_arn    = module.acm.certificate_arn
}

# Route 53 DNS Module
module "route53" {
  source = "./modules/route53"
  
  domain                      = var.domain
  cloudfront_domain_name      = module.cloudfront.distribution_domain_name
  cloudfront_hosted_zone_id   = module.cloudfront.distribution_hosted_zone_id
}

# ACM Certificate Module (us-east-1 for CloudFront)
module "acm" {
  source = "./modules/acm"
  
  providers = {
    aws = aws.us_east_1
  }
  
  domain           = var.domain
  route53_zone_id  = module.route53.zone_id
}

# IAM User and Policy Module
module "iam" {
  source = "./modules/iam"
  
  iam_user_name                = var.iam_user_name
  production_bucket_arn        = module.s3.production_bucket_arn
  baseline_bucket_arn          = module.s3.baseline_bucket_arn
  cloudfront_distribution_arn  = module.cloudfront.distribution_arn
  state_bucket_arn             = format("arn:aws:s3:::%s", var.terraform_state_bucket_name)
  state_lock_table_arn         = format("arn:aws:dynamodb:%s:%s:table/%s", var.aws_region, data.aws_caller_identity.current.account_id, var.terraform_state_lock_table_name)
}

# SSM Parameter Store Module
module "ssm" {
  source = "./modules/ssm"
  
  namespace                   = var.parameter_store_namespace
  s3_bucket_name              = module.s3.production_bucket_name
  domain                      = var.domain
  cloudfront_distribution_id  = module.cloudfront.distribution_id
  aws_region                  = var.aws_region
}
