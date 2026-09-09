# Terraform AWS S3 module

Creates an S3 bucket with public access blocked, bucket-owner-enforced object ownership, server-side encryption, and optional object expiration. Object versioning is enabled by default.

## Requirements

- Terraform `>= 1.3.0`
- AWS provider `>= 5.0`
- AWS credentials and a region configured by the calling Terraform project

## Usage

Use a released tag to pin the module version:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

module "s3" {
  source = "git::https://github.com/s6peter/terraform-aws-s3.git?ref=v1.0.0"

  bucket_name = "my-globally-unique-application-bucket"
  tags = {
    Environment = "development"
    ManagedBy   = "Terraform"
  }
}

output "bucket_arn" {
  value = module.s3.bucket_arn
}
```

Set `kms_key_id` to an existing KMS key ARN or ID to use SSE-KMS. When omitted, the bucket uses SSE-S3 (`AES256`). The module does not create a KMS key or manage its permissions.

The repository is private. Authenticate Git before running `terraform init` or Terragrunt, using your Git credential manager or an SSH key with repository access. Do not put access tokens in module source URLs. For SSH, use `git::ssh://git@github.com/s6peter/terraform-aws-s3.git?ref=v1.0.0`.

Terragrunt can use the same released module:

```hcl
terraform {
  source = "git::ssh://git@github.com/s6peter/terraform-aws-s3.git?ref=v1.0.0"
}

inputs = {
  bucket_name = "my-globally-unique-application-bucket"
  tags = {
    Environment = "development"
  }
}
```

## Inputs

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `bucket_name` | `string` | `null` | Globally unique bucket name; when omitted, the provider generates a name. |
| `force_destroy` | `bool` | `false` | Allow Terraform to delete a bucket containing objects. |
| `versioning_enabled` | `bool` | `true` | Enable versioning; `false` configures suspended versioning. |
| `kms_key_id` | `string` | `null` | Existing KMS key ARN or ID for SSE-KMS; otherwise use SSE-S3. |
| `lifecycle_expiration_days` | `number` | `null` | Expire current objects after this many days; `null` disables the expiration rule. |
| `tags` | `map(string)` | `{}` | Tags applied to the bucket. |

Expiration applies to current object versions. This module does not configure expiration of noncurrent versions.

## Outputs

| Name | Description |
| --- | --- |
| `bucket_id` | S3 bucket name. |
| `bucket_arn` | S3 bucket ARN. |
| `bucket_domain_name` | S3 bucket regional domain name. |

## Validation

```sh
terraform fmt -check -recursive
terraform init -backend=false -input=false
terraform validate
```

These checks validate configuration without creating AWS resources.

To check the release tooling locally, use Node.js 24 and run:

```sh
npm ci --ignore-scripts
npm test
```

This verifies version detection and release-note rendering without publishing a release.

## Releases

Submit changes through a feature-branch pull request targeting `main`. After CI passes and an independent reviewer approves, merge the PR. Successful `main` CI automatically opens or reuses a pull request from `main` to `release`. An independent reviewer approves that promotion before it is merged. The release workflow verifies approval, reruns validation and release tests, then uses semantic-release to publish a qualifying version tag and GitHub release.

Both branches require repository protection to enforce review before merge. The setup instructions and current GitHub plan limitation are documented in [Reviewed release workflow](docs/reviewed-release-flow.md).

The first qualifying release is `v1.0.0`; subsequent releases follow these rules:

| Commit | Version change |
| --- | --- |
| `fix: correct bucket configuration` | Patch, for example `1.0.0` → `1.0.1` |
| `feat: add a bucket option` | Minor, for example `1.0.0` → `1.1.0` |
| `feat!: remove an input` or a `BREAKING CHANGE:` footer | Major, for example `1.0.0` → `2.0.0` |
| `docs:`, `chore:`, or other commits without a release-triggering change | No release |

Use Conventional Commit messages for individual commits and PR titles. Use **Create a merge commit** for merges to preserve history; do not squash or rebase release promotions. No npm package is published; consumers use Git tags in their Terraform module source. You do not need to switch to or push the `release` branch locally.
