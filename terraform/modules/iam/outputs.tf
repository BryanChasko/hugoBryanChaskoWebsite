output "user_name" {
  description = "IAM user name"
  value       = aws_iam_user.github_actions.name
}

output "user_arn" {
  description = "IAM user ARN"
  value       = aws_iam_user.github_actions.arn
}

output "user_unique_id" {
  description = "IAM user unique ID"
  value       = aws_iam_user.github_actions.unique_id
}
