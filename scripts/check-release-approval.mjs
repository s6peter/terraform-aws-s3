import { githubClient, listAll } from './github.mjs';
import { checkReleasePullRequest, checkApprovals } from './pr-policy.mjs';

const api = githubClient();
const repository = process.env.GITHUB_REPOSITORY;
const sha = process.env.GITHUB_SHA;
const base = `repos/${repository}`;
const candidates = await listAll(api, `${base}/commits/${sha}/pulls`);
const candidate = candidates.find(pr => pr.base.ref === 'release' && pr.merge_commit_sha === sha && pr.merged_at);
if (!candidate) throw new Error('No merged release pull request matches this commit; direct pushes cannot publish');
const pr = await api(`${base}/pulls/${candidate.number}`);
const commit = await api(`${base}/commits/${sha}`);
checkReleasePullRequest(pr, repository, sha, commit.parents);
const reviews = await listAll(api, `${base}/pulls/${pr.number}/reviews`);
await checkApprovals(pr, reviews, async login => {
  const result = await api(`${base}/collaborators/${encodeURIComponent(login)}/permission`);
  return result.permission;
});
console.log(`Release PR #${pr.number} has an independent approval for ${pr.head.sha}`);
