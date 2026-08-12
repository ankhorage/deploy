import { expect, test } from 'bun:test';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { assertSafeSegment } from './io/assertSafeSegment';
import { atomicWriteJson } from './io/atomicWriteJson';
import { resolveProjectDeploymentPaths } from './resolveProjectDeploymentPaths';

test('resolves the frozen authored deployment layout from one project root', () => {
  const root = path.resolve('/tmp/example-project');
  const paths = resolveProjectDeploymentPaths(root);
  expect(paths.listingRoot).toBe(path.join(root, 'deploy', 'listing'));
  expect(paths.sharedAssetsRoot).toBe(path.join(root, 'deploy', 'assets', 'shared'));
  expect(paths.androidScreenshotsRoot).toBe(
    path.join(root, 'deploy', 'assets', 'android', 'screenshots'),
  );
  expect(paths.iosScreenshotsRoot).toBe(
    path.join(root, 'deploy', 'assets', 'ios', 'screenshots'),
  );
  expect(paths.productsPath).toBe(path.join(root, 'deploy', 'monetization', 'products.json'));
  expect(paths.releasePath).toBe(path.join(root, 'deploy', 'release.json'));
  expect(paths.historyRoot).toBe(path.join(root, '.ankh', 'deployments'));
});

test('safe segments reject traversal and path separators', () => {
  for (const value of ['', '.', '..', '../outside', 'nested/value', 'nested\\value']) {
    expect(() => assertSafeSegment(value, 'test segment')).toThrow('one safe path segment');
  }
  expect(() => assertSafeSegment('release-2026-08-12', 'test segment')).not.toThrow();
});

test('safe writer rejects an existing symlink that escapes the project root', async () => {
  const projectRoot = await fs.mkdtemp(path.join(tmpdir(), 'ankh-deploy-root-'));
  const outsideRoot = await fs.mkdtemp(path.join(tmpdir(), 'ankh-deploy-outside-'));
  try {
    await fs.symlink(outsideRoot, path.join(projectRoot, 'deploy'));
    await expect(
      atomicWriteJson({
        projectRoot,
        filePath: path.join(projectRoot, 'deploy', 'release.json'),
        value: { safe: true },
      }),
    ).rejects.toThrow('resolves outside project root');
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
    await fs.rm(outsideRoot, { recursive: true, force: true });
  }
});
