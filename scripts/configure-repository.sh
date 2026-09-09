#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
repository="${1:-s6peter/terraform-aws-s3}"

# Check feature availability before making any changes.
gh api "repos/$repository/rulesets" >/dev/null

# Keep both long-lived branches and preserve the commit history used for releases.
gh api --method PATCH "repos/$repository" \
  -F allow_merge_commit=true -F allow_squash_merge=false \
  -F allow_rebase_merge=false -F delete_branch_on_merge=false >/dev/null
gh api --method PUT "repos/$repository/actions/permissions/workflow" \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true >/dev/null

for branch in main release; do
  gh api --method PUT "repos/$repository/branches/$branch/protection" \
    --input ".github/$branch-protection.json" >/dev/null
done
printf 'Configured required reviews and CI checks for %s main and release.\n' "$repository"
