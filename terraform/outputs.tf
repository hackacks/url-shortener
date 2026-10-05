output "shortner_domain_name" {
  #output my custom shortner domain name
   value = "shortner.${var.route53_zone_name}"
 }