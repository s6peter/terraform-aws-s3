# Reviewed release workflow

```text
Feature branch pull request targeting main
  -> automatic Terraform validation and release-tooling tests
  -> independent code approval and merge
  -> main CI passes and opens a main-to-release pull request
  -> independent release approval and merge
  -> approval verification, validation, version tag and GitHub release
```

## Submit a change

Create a feature branch from updated `main`, commit the changed files, push the
feature branch, and open a pull request with **base `main`**. Do not push changes
directly to `main` or `release`.

```sh
git switch main
git pull --ff-only origin main
git switch -c feat/access-logging
# Edit files, then stage the specific files you changed.
git add main.tf variables.tf
git commit -m "feat: add access logging support"
git push -u origin feat/access-logging
gh pr create --base main --title "feat: add access logging support" --body-file /path/to/pr-description.md
```

Use a Conventional Commit title and Conventional Commit messages for individual
commits. Normal GitHub merge commits are allowed. `fix:` and `perf:` trigger patch
releases, `feat:` triggers minor releases, and `!` / `BREAKING CHANGE:` trigger major
releases. Other valid types such as `docs:`, `test:`, and `ci:` do not release alone.

## Code review and release approval

The required PR checks are **Check pull request**, **Validate Terraform**, and
**Check release tooling**. A reviewer with write access approves the latest
changes, conversations are resolved, and a maintainer merges using **Create a
merge commit**.

After `main` passes CI, the workflow opens or reuses a pull request with **base
`release`** and **head `main`**. It never approves or merges it. Review all changes
included in the promotion, approve its latest commit, then merge using **Create a
merge commit**. Keep both long-lived branches. New commits on `main` update the
open promotion PR and require fresh approval under the protection rules.

The release workflow checks that its exact commit is the merge of a same-repository
main-to-release PR, with an approval from an independent human reviewer who has
write access. It rejects missing or stale approvals and outstanding changes
requested. Terraform validation and release regression checks run before semantic-release.
Direct pushes and squash/rebase promotions fail the publishing gate. A manual
workflow rerun does not bypass the approval check. Documentation-only promotions
can pass without publishing a new version.

## Required repository settings

Workflow YAML cannot enforce pre-merge reviews by itself. Configure branch
protection on both branches using the checked-in JSON definitions:

```sh
bash scripts/configure-repository.sh
```

This administrator command requires branch-protection support and replaces the
classic protection settings for these two branches with this repository's declared
policy. Review the JSON files before running it if you add other protection settings.
It requires one independent approval, dismisses stale approvals, requires approval
of the latest push, enforces checks and conversation resolution, includes admins,
and blocks force pushes and branch deletion. It enables merge commits only and
allows Actions to create pull requests. The workflow does not use that permission
to approve reviews. The script does not change repository visibility or add collaborators.

`main` must be current with its base before merging. `release` intentionally does
not require its own merge commits to be merged back into `main`: its required PR
checks run on the proposed merge, and the release workflow checks the final merge.

**Setup limitation observed on 9 September 2026:** GitHub returned HTTP 403 for
protection on this private repository and requested GitHub Pro or public visibility.
Only `s6peter` was listed as a collaborator. Keep the repository private and upgrade,
or explicitly choose public visibility, then configure protection. Add at least one
trusted reviewer with write access; authors cannot approve their own PRs. These are
required setup steps, not controls that these files have already enabled.

Until protection is available, contributors can bypass CI before merging or change
the workflow itself. The publishing gate is additional validation, not a substitute
for server-enforced branch protection.

## Automatic PR authentication

By default, the PR job uses `GITHUB_TOKEN`. Enable **Settings > Actions > General >
Workflow permissions > Allow GitHub Actions to create and approve pull requests**
(the setup script handles this). GitHub may show **Approve workflows to run** for
the bot-created PR; a user with write access starts those checks before release
approval. Starting checks is separate from approving the code change.

To have bot-created PR checks start without that extra prompt, optionally configure
`RELEASE_PR_TOKEN` with a narrowly scoped token that can read repository contents
and create pull requests. A dedicated GitHub App with a fresh installation token
is preferable for a long-lived enterprise setup; adapt the token-generation step
when that App is provisioned. Do not store a short-lived installation token as a
permanent secret. No extra token is needed for the default flow.

## References

- [GitHub branch protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GITHUB_TOKEN events and PR workflow approval](https://docs.github.com/en/actions/concepts/security/github_token)
