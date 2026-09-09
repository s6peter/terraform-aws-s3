import { readFile } from 'node:fs/promises';
import { githubClient, listAll } from './github.mjs';
import { checkPullRequest } from './pr-policy.mjs';

const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
const pr = event.pull_request;
if (!pr) throw new Error('This check requires a pull_request event');
const api = githubClient();
const commits = await listAll(api, `repos/${process.env.GITHUB_REPOSITORY}/pulls/${pr.number}/commits`);
checkPullRequest(pr, process.env.GITHUB_REPOSITORY, commits);
console.log('Pull request branch and Conventional Commit checks passed');
