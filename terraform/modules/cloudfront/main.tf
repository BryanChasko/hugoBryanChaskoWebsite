# CloudFront Origin Access Control (OAC)
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${var.domain}-oac"
  description                       = "Origin Access Control for ${var.domain}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Function for URL rewriting (Hugo static site routing)
resource "aws_cloudfront_function" "url_rewrite" {
  name    = "${replace(var.domain, ".", "-")}-url-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite URLs to add index.html for Hugo static site"
  publish = true
  code    = <<-EOF
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // If URI doesn't have a file extension and doesn't end with /
    if (!uri.includes('.') && !uri.endsWith('/')) {
        request.uri = uri + '/index.html';
    }
    // If URI ends with / but not /index.html
    else if (uri.endsWith('/') && !uri.endsWith('/index.html')) {
        request.uri = uri + 'index.html';
    }
    
    return request;
}
EOF
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Distribution for ${var.domain}"
  default_root_object = "index.html"     # Hugo generates index.html
  price_class         = "PriceClass_100" # North America and Europe

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

    # CloudFront Function for URL rewriting (Hugo subdirectory index.html)
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.url_rewrite.arn
    }
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

  # Custom error response for Hugo 404 page
  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
    error_caching_min_ttl = 10
  }

  # Note: 403 errors from S3 typically mean the object doesn't exist (OAC returns 403 for missing objects)
  # The CloudFront Function handles URL rewriting to index.html, so most 403s should not occur
  # If they do, show the 404 page
  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/404.html"
    error_caching_min_ttl = 10
  }
}
