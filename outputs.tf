output "bucket_id" {
  description = "The S3 bucket name."
  value       = aws_s3_bucket.this.id
}

output "bucket_arn" {
  description = "The S3 bucket ARN."
  value       = aws_s3_bucket.this.arn
}

output "bucket_domain_name" {
  description = "The S3 bucket regional domain name."
  value       = aws_s3_bucket.this.bucket_regional_domain_name
}