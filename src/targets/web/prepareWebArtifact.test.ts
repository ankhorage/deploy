import { expect, test } from 'bun:test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { DeploymentProcessRunner } from '../../runtime/process/DeploymentProcessRunner';
import { cleanupWebArtifact, prepareWebArtifact } from './prepareWebArtifact';

const fakeExport: DeploymentProcessRunner = async (request) => {
  const outputIndex = request.args.indexOf('--output-dir');
  const output = request.args[outputIndex + 1];
  if (output === undefined) return { exitCode: 1, stdout: '', stderr: '' };
  await fs.mkdir(path.join(output, 'assets'), { recursive: true });
  await fs.writeFile(path.join(output, 'index.html'), '<html />');
  await fs.writeFile(path.join(output, 'assets', 'app.js'), 'app');
  return { exitCode: 0, stdout: '', stderr: '' };
};

test('web artifact preparation uses project-local Expo and returns a revision', async () => {
  const result = await prepareWebArtifact({ projectRoot: '/project', runProcess: fakeExport });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.artifact.revision).toHaveLength(64);
  await expect(fs.stat(result.artifact.directory)).resolves.toBeDefined();
  await cleanupWebArtifact(result.artifact.directory);
  await expect(fs.stat(result.artifact.directory)).rejects.toBeDefined();
});

test('failed Expo export cleans its temporary directory', async () => {
  let output = '';
  const runner: DeploymentProcessRunner = (request) => {
    output = request.args[request.args.indexOf('--output-dir') + 1] ?? '';
    return Promise.resolve({ exitCode: 1, stdout: 'ignored', stderr: 'secret output' });
  };
  const result = await prepareWebArtifact({ projectRoot: '/project', runProcess: runner });
  expect(result.ok).toBe(false);
  expect(output.length).toBeGreaterThan(0);
  await expect(fs.stat(output)).rejects.toBeDefined();
  expect(JSON.stringify(result)).not.toContain('secret output');
});
