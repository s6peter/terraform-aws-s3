const conventional = /^(feat|fix|perf|refactor|docs|test|build|ci|chore|style|revert)(\([^\r\n()]+\))?!?: \S[^\r\n]*$/;

export function checkPullRequest(pr, repository, commits) {
  if (!['main', 'release'].includes(pr.base.ref)) throw new Error('Unexpected target branch');
  if (pr.base.ref === 'release' &&
      (pr.head.ref !== 'main' || pr.head.repo?.full_name !== repository)) {
    throw new Error('Release pull requests must come from main in this repository');
  }
  if (!conventional.test(pr.title)) throw new Error('Use a Conventional Commit pull request title');
  for (const commit of commits) {
    if (commit.parents.length > 1) continue; // Preserve normal GitHub merge commits.
    const subject = commit.commit.message.split('\n')[0];
    if (!conventional.test(subject)) {
      throw new Error(`Commit ${commit.sha.slice(0, 7)} needs a Conventional Commit message: ${subject}`);
    }
  }
}

export function checkReleasePullRequest(pr, repository, sha, parents) {
  if (!pr.merged || pr.base.ref !== 'release' || pr.head.ref !== 'main' ||
      pr.head.repo?.full_name !== repository || pr.merge_commit_sha !== sha) {
    throw new Error('Release must be the merge of a main-to-release pull request');
  }
  if (parents.length !== 2 || parents[1].sha !== pr.head.sha) {
    throw new Error('Use Create a merge commit when promoting main to release');
  }
}

export async function checkApprovals(pr, reviews, getPermission) {
  const latest = new Map();
  for (const review of [...reviews].sort((a, b) => a.id - b.id)) {
    if (['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state)) {
      latest.set(review.user.login, review);
    }
  }
  let approved = false;
  for (const review of latest.values()) {
    if (review.user.type !== 'User' || review.user.login === pr.user.login) continue;
    const permission = await getPermission(review.user.login);
    if (!['admin', 'write', 'maintain'].includes(permission)) continue;
    if (review.state === 'CHANGES_REQUESTED') throw new Error('A reviewer still requests changes');
    const reviewedAt = Date.parse(review.submitted_at);
    const mergedAt = Date.parse(pr.merged_at);
    if (review.state === 'APPROVED' && review.commit_id === pr.head.sha &&
        Number.isFinite(reviewedAt) && Number.isFinite(mergedAt) && reviewedAt <= mergedAt) {
      approved = true;
    }
  }
  if (!approved) throw new Error('An independent write-access reviewer must approve the latest PR commit');
}
