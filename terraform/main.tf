terraform {
  backend "s3" {
    bucket = "state-bucket-ji0qu"
    key    = "url-shortner/terraform.tfstate"
    region = "ap-south-1"
    use_lockfile = true
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
  required_version = ">= 1.15.0"
}

provider "aws" {
  region = var.aws_region
}
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

#getting existing hosted zone for from route53
data "aws_route53_zone" "arun_isroot_in" {
  name         = var.route53_zone_name
  private_zone = false
}
#getting existing acm record ARN in us-east-1
data "aws_acm_certificate" "url_shortner_certificate" {
  provider = aws.us_east_1
  domain   = var.acm_certificate_name
  statuses = ["ISSUED"]
}

resource "aws_s3_bucket" "url_shortner_bucket" {
  bucket = "url-shortner-bucket-f9wv8rpn"
  region = "ap-south-1"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "url_shortner_bucket_public_access_block" {
  bucket = aws_s3_bucket.url_shortner_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "url_shortner_bucket_versioning" {
  bucket = aws_s3_bucket.url_shortner_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_cloudfront_origin_access_control" "url_shortner_oac" {
  name = "url-shortner-oac"
  signing_behavior = "always"
  signing_protocol = "sigv4"
  origin_access_control_origin_type = "s3"
  description = "Origin Access Control for URL Shortener CloudFront Distribution"
}

resource "aws_cloudfront_distribution" "url_shortner_distribution" {
  origin {
    domain_name = aws_s3_bucket.url_shortner_bucket.bucket_regional_domain_name
    origin_id   = "S3-url-shortner-bucket"
    origin_access_control_id = aws_cloudfront_origin_access_control.url_shortner_oac.id
  }
  aliases = [
    "shortner.${var.route53_zone_name}"
  ]
  enabled             = true
  is_ipv6_enabled     = false
  comment             = "CloudFront distribution for URL Shortener"
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-url-shortner-bucket"
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
    compress          = true

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    acm_certificate_arn = data.aws_acm_certificate.url_shortner_certificate.arn
    ssl_support_method  = "sni-only"
    minimum_protocol_version = "TLSv1.2_2018"
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }
}

data "aws_iam_policy_document" "url_shortner_bucket_policy" {
  statement {
    sid       = "AllowCloudFrontServicePrincipalReadOnly"
    effect    = "Allow"
    actions   = [
      "s3:GetObject"
    ]

    resources = [
      "${aws_s3_bucket.url_shortner_bucket.arn}/*"
    ]
    
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [
        aws_cloudfront_distribution.url_shortner_distribution.arn
      ]
    }
  }
}

resource "aws_s3_bucket_policy" "url_shortner_bucket_policy" {
  bucket = aws_s3_bucket.url_shortner_bucket.id
  policy = data.aws_iam_policy_document.url_shortner_bucket_policy.json
}

#creation of Alias record in route53 for cloudfront distribution
resource "aws_route53_record" "url_shortner_alias_record" {
  zone_id = data.aws_route53_zone.arun_isroot_in.zone_id
  name   = "shortner.${var.route53_zone_name}"
  type   = "A"
  alias {
    name                   = aws_cloudfront_distribution.url_shortner_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.url_shortner_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

#creation of IAM provider for github actions
resource "aws_iam_openid_connect_provider" "github_actions_oidc_provider" {
  url = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

#creation of policy for github actions to access s3 bucket and cloudfront distribution cache invalidation
resource "aws_iam_policy" "url_shortner_github_actions_policy" {
  name = "url-shortner-github-actions-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.url_shortner_bucket.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
        ]
        Resource = "${aws_s3_bucket.url_shortner_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = aws_cloudfront_distribution.url_shortner_distribution.arn
      }
    ]
  })
}

#creation of IAM role for github actions to assume
resource "aws_iam_role" "url_shortner_github_actions_role" {
  name = "url-shortner-github-actions-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions_oidc_provider.arn
                }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              "repo:hackacks/url-shortener:ref:refs/heads/main",
              "repo:hackacks*/url-shortener*:ref:refs/heads/main"
            ]
          }
        }
      }
    ]
  })
}
  #policy attachment for the role to allow access to s3 bucket
resource "aws_iam_role_policy_attachment" "url_shortner_github_actions_role_policy_attachment" {
  role       = aws_iam_role.url_shortner_github_actions_role.name
  policy_arn = aws_iam_policy.url_shortner_github_actions_policy.arn
}