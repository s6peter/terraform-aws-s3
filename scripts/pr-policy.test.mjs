import test from 'node:test';
import assert from 'node:assert/strict';
import { checkPullRequest, checkReleasePullRequest, checkApprovals } from './pr-policy.mjs';

const repository = 'example/terraform-aws-s3';
const pr = {
  title: 'chore(release): promote main to release',
  user: { login: 'author' }, base: { ref: 'release' },
  head: { ref: 'main', sha: 'head', repo: { full_name: repository } },
  merged: true, merge_commit_sha: 'merge', merged_at: '2026-09-09T12:00:00Z',
};
const approval = { id: 1, user: { login: 'reviewer', type: 'User' }, state: 'APPROVED', commit_id: 'head', submitted_at: '2026-09-09T11:00:00Z' };
const permission = async () => 'write';

test('release accepts only same-repository main PRs', () => {
  checkPullRequest(pr, repository, []);
  assert.throws(() => checkPullRequest({ ...pr, head: { ...pr.head, ref: 'feature' } }, repository, []));
  assert.throws(() => checkPullRequest({ ...pr, head: { ...pr.head, repo: { full_name: 'fork/repo' } } }, repository, []));
});
test('commit policy rejects unparseable messages while allowing merge commits', () => {
  const commit = { sha: '1234567', parents: [{}], commit: { message: 'feat!: change an input' } };
  checkPullRequest(pr, repository, [commit]);
  assert.throws(() => checkPullRequest(pr, repository, [{ ...commit, commit: { message: 'test version' } }]));
  checkPullRequest(pr, repository, [{ ...commit, parents: [{}, {}], commit: { message: 'Merge pull request #1' } }]);
});
test('release must match the actual merge commit and preserve main history', () => {
  checkReleasePullRequest(pr, repository, 'merge', [{ sha: 'base' }, { sha: 'head' }]);
  assert.throws(() => checkReleasePullRequest(pr, repository, 'direct-push', [{ sha: 'head' }]));
  assert.throws(() => checkReleasePullRequest(pr, repository, 'merge', [{ sha: 'base' }]));
  assert.throws(() => checkReleasePullRequest({ ...pr, merged: false }, repository, 'merge', [{ sha: 'base' }, { sha: 'head' }]));
});
test('latest-head approval from an independent maintainer is accepted', async () => {
  await checkApprovals(pr, [approval], permission);
});
test('missing, stale, dismissed, self, bot and read-only approvals are rejected', async () => {
  for (const reviews of [[], [{ ...approval, commit_id: 'old' }],
    [approval, { ...approval, id: 2, state: 'DISMISSED' }],
    [{ ...approval, user: { login: 'author', type: 'User' } }],
    [{ ...approval, user: { login: 'bot', type: 'Bot' } }]]) {
    await assert.rejects(checkApprovals(pr, reviews, permission));
  }
  await assert.rejects(checkApprovals(pr, [approval], async () => 'read'));
});
test('changes requested block release until the reviewer approves again', async () => {
  const change = { ...approval, id: 2, state: 'CHANGES_REQUESTED' };
  await assert.rejects(checkApprovals(pr, [approval, change], permission));
  await checkApprovals(pr, [approval, change, { ...approval, id: 3 }], permission);
});
test('a comment does not cancel an approval', async () => {
  await checkApprovals(pr, [approval, { ...approval, id: 2, state: 'COMMENTED' }], permission);
});
test('approval after merge cannot retroactively authorize the release', async () => {
  await assert.rejects(checkApprovals(pr, [{ ...approval, submitted_at: '2026-09-09T13:00:00Z' }], permission));
});
