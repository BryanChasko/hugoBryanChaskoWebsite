output "zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "name_servers" {
  description = "Route 53 hosted zone name servers"
  value       = aws_route53_zone.main.name_servers
}
