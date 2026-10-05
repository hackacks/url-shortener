
variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "ap-south-1"
}
variable "route53_zone_name" {
  description = "The name of the Route 53 hosted zone"
  type        = string
}

variable "acm_certificate_name" {
  description = "The name of the ACM certificate"
  type        = string
}
