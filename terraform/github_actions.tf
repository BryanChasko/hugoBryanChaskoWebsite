# GitHub Actions OIDC role and permissions for Terraform jobs

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = var.github_oidc_provider_url
  client_id_list  = [var.github_oidc_client_id]
  thumbprint_list = [var.github_oidc_thumbprint]
}

resource "aws_iam_role" "github_actions_terraform" {
  name               = "github-actions-terraform-role"
  assume_role_policy = data.aws_iam_policy_document.github_oidc_trust.json
  description        = "Role assumed by GitHub Actions when running terraform plan/apply"
}

data "aws_iam_policy_document" "github_oidc_trust" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = [var.github_oidc_client_id]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [var.github_oidc_subject]
    }
  }
}

data "aws_iam_policy_document" "github_actions_permissions" {
  statement {
    sid    = "S3StateBucket"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket",
      "s3:DeleteObject"
    ]
    resources = [
      "arn:aws:s3:::${var.terraform_state_bucket_name}",
      "arn:aws:s3:::${var.terraform_state_bucket_name}/*"
    ]
  }

  statement {
    sid    = "S3BaselineBucket"
    effect = "Allow"
    actions = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
    resources = [
      module.s3.baseline_bucket_arn,
      "${module.s3.baseline_bucket_arn}/*"
    ]
  }

  statement {
    sid    = "S3DeployBucket"
    effect = "Allow"
    actions = ["s3:*"]
    resources = [
      module.s3.production_bucket_arn,
      "${module.s3.production_bucket_arn}/*"
    ]
  }

  statement {
    sid    = "DynamoDBStateLock"
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:DeleteItem",
      "dynamodb:UpdateItem",
      "dynamodb:DescribeTable",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem"
    ]
    resources = [
      format("arn:aws:dynamodb:%s:%s:table/%s", var.aws_region, data.aws_caller_identity.current.account_id, var.terraform_state_lock_table_name)
    ]
  }

  statement {
    sid    = "CloudFrontManagement"
    effect = "Allow"
    actions = ["cloudfront:*"]
    resources = ["*"]
  }

  statement {
    sid    = "SSMParameterRead"
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters"
    ]
    resources = ["arn:aws:ssm:*:*:parameter/sites/*"]
  }
}

resource "aws_iam_role_policy" "github_actions_terraform" {
  name   = "github-actions-terraform-policy"
  role   = aws_iam_role.github_actions_terraform.id
  policy = data.aws_iam_policy_document.github_actions_permissions.json
}
