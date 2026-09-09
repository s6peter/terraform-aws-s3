variable "bucket_name" {
  description = "Globally unique S3 bucket name. Leave null to let AWS generate one."
  type        = string
  default     = null
}

variable "force_destroy" {
  description = "Allow Terraform to delete the bucket even when it contains objects."
  type        = bool
  default     = false
}

variable "versioning_enabled" {
  description = "Enable S3 object versioning."
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "Optional KMS key ARN or ID for server-side encryption. Uses SSE-S3 when null."
  type        = string
  default     = null
}

variable "lifecycle_expiration_days" {
  description = "Optional number of days after which objects expire."
  type        = number
  default     = null
  nullable    = true
}

variable "tags" {
  description = "Tags applied to the bucket."
  type        = map(string)
  default     = {}
}