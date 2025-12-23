terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # S3 backend with DynamoDB locking for team collaboration
  backend "s3" {
    bucket         = "bryanchasko-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "bryanchasko-terraform-lock"
    encrypt        = true
    profile        = "websites-bryanchasko"
  }
}
