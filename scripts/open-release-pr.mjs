import { appendFile } from 'node:fs/promises';
import { githubClient, listAll } from './github.mjs';

const api = githubClient();
const repository = process.env.GITHUB_REPOSITORY;
const base = `repos/${repository}`;
const main = await api(`${base}/git/ref/heads/main`);
if (main.object.sha !== process.env.GITHUB_SHA) {
  console.log('main has advanced; its own successful CI run will handle promotion');
  process.exit(0);
}
const comparison = await api(`${base}/compare/release...main`);
if (comparison.ahead_by === 0) {
  console.log('No main commits need promotion');
  process.exit(0);
}
const owner = repository.split('/')[0];
const existing = await listAll(api, `${base}/pulls?state=open&base=release&head=${encodeURIComponent(`${owner}:main`)}`);
let pr = existing[0];
if (!pr) {
  pr = await api(`${base}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'chore(release): promote main to release',
      head: 'main', base: 'release',
      body: 'Promote the validated commits from main to release.\n\nAn independent maintainer must review and approve the latest commit before merging. Use **Create a merge commit** to preserve Conventional Commits. Publishing rechecks approval, Terraform validation, and release-tooling tests.\n\nIf GitHub shows **Approve workflows to run**, start the PR checks before reviewing. This workflow never approves or merges this PR.',
    }),
  });
}
console.log(`Release pull request: ${pr.html_url}`);
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Release promotion\n\n[Review the main to release pull request](${pr.html_url}).\n`);
}
