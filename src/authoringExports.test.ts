import { promises as fs } from 'node:fs';

import { expect, test } from 'bun:test';

import type {
  DeployMonetizationAuthoringValue,
  DeployReleaseAuthoringValue,
} from './authoring';
import {
  DEPLOY_AUTHORING_STRUCTURE,
  fromDeployMonetizationAuthoringValue,
  fromDeployReleaseAuthoringValue,
  toDeployMonetizationAuthoringValue,
  toDeployReleaseAuthoringValue,
} from './authoring';

test('authoring facade exposes the owner descriptor and canonical projections', () => {
  expect(DEPLOY_AUTHORING_STRUCTURE.packageName).toBe('@ankhorage/deploy');
  expect(typeof fromDeployMonetizationAuthoringValue).toBe('function');
  expect(typeof fromDeployReleaseAuthoringValue).toBe('function');
  expect(typeof toDeployMonetizationAuthoringValue).toBe('function');
  expect(typeof toDeployReleaseAuthoringValue).toBe('function');

  const monetization: DeployMonetizationAuthoringValue =
    toDeployMonetizationAuthoringValue([]);
  const release: DeployReleaseAuthoringValue = toDeployReleaseAuthoringValue({
    version: '1.0.0',
    targets: ['web'],
    notes: [],
    rollout: { web: { mode: 'immediate' } },
  });
  expect(monetization.products).toEqual({});
  expect(release.targets).toEqual({ web: true });
});

test('package publishes the explicit authoring subpath', async () => {
  const packageUrl = new URL('../package.json', import.meta.url);
  const parsed = JSON.parse(await fs.readFile(packageUrl, 'utf8')) as {
    readonly exports?: Record<string, unknown>;
  };

  expect(parsed.exports?.['./authoring']).toEqual({
    types: './dist/authoring.d.ts',
    import: './dist/authoring.js',
    default: './dist/authoring.js',
  });
});
