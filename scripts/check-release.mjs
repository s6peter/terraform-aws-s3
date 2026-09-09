import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analyzeCommits } from '@semantic-release/commit-analyzer';
import { generateNotes } from '@semantic-release/release-notes-generator';

const config = JSON.parse(await readFile(new URL('../.releaserc.json', import.meta.url)));
const pluginOptions = (name) => config.plugins.find((plugin) => plugin[0] === name)[1];
const context = {
  cwd: process.cwd(),
  options: { repositoryUrl: 'https://github.com/s6peter/terraform-aws-s3.git' },
  logger: { log() {} },
};

for (const [message, expected] of [
  ['fix: correct bucket configuration', 'patch'],
  ['feat: add bucket option', 'minor'],
  ['feat!: remove an input', 'major'],
  ['refactor: update outputs\n\nBREAKING CHANGE: remove legacy output', 'major'],
  ['docs: clarify usage', null],
]) {
  const result = await analyzeCommits(pluginOptions('@semantic-release/commit-analyzer'), {
    ...context, commits: [{ hash: 'abc1234', message }],
  });
  assert.equal(result, expected, message);
  console.log(`${message.split('\n')[0]} => ${result ?? 'no release'}`);
}

const notes = await generateNotes(pluginOptions('@semantic-release/release-notes-generator'), {
  ...context,
  commits: [{ hash: 'abc1234', message: 'feat!: remove an input\n\nBREAKING CHANGE: remove legacy input' }],
  lastRelease: {},
  nextRelease: { version: '1.0.0', gitTag: 'v1.0.0' },
});
assert.match(notes, /1\.0\.0/);
assert.match(notes, /remove an input/);
assert.match(notes, /BREAKING CHANGES/);
assert.match(notes, /remove legacy input/);
console.log('Release notes rendered successfully, including breaking changes.');
