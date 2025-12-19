# IAM User for GitHub Actions
resource "aws_iam_user" "github_actions" {
  name = var.iam_user_name

  tags = {
    Purpose = "GitHub Actions CI/CD"
  }
}

# IAM Policy for GitHub Actions
resource "aws_iam_user_policy" "github_actions" {
  name = "github-actions-webgl-policy"
  user = aws_iam_user.github_actions.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3BaselineBucket"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.baseline_bucket_arn,
          "${var.baseline_bucket_arn}/*"
        ]
      },
      {
        Sid    = "S3DeployBucket"
        Effect = "Allow"
        Action = ["s3:*"]
        Resource = [
          var.production_bucket_arn,
          "${var.production_bucket_arn}/*"
        ]
      },
      {
        Sid    = "S3StateBucket"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
          "s3:DeleteObject"
        ]
        Resource = [
          var.state_bucket_arn,
          "${var.state_bucket_arn}/*"
        ]
      },
      {
        Sid    = "CloudFrontInvalidate"
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:ListDistributions"
        ]
        Resource = "*"
      },
      {
        Sid    = "DynamoDBStateLock"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:DeleteItem",
          "dynamodb:UpdateItem",
          "dynamodb:DescribeTable",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = var.state_lock_table_arn
      },
      {
        Sid    = "SSMParameterRead"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/sites/*"
      }
    ]
  })
}
