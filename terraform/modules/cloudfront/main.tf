# CloudFront Origin Access Control (OAC)
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${var.domain}-oac"
  description                       = "Origin Access Control for ${var.domain}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Distribution for ${var.domain}"
  default_root_object = ""  # Empty for SPA routing
  price_class         = "PriceClass_100"  # North America and Europe
  
  aliases = [
    var.domain,
    "www.${var.domain}"
  ]
  
  origin {
    domain_name              = var.s3_bucket_regional_domain
    origin_id                = "s3-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }
  
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-origin"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    
    # Use CloudFront managed cache policy
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    
    # Legacy settings (required when not using managed policies)
    # Commenting out as we're using managed cache_policy_id
    # min_ttl     = 0
    # default_ttl = 3600
    # max_ttl     = 86400
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  # Custom error responses for SPA routing
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
  
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
}
