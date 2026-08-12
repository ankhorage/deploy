import type { AppDeployManifest } from '@ankhorage/contracts/deploy';
import { expect, test } from 'bun:test';

import { createDeploymentChanges } from './createDeploymentChanges';

const DESIRED: AppDeployManifest = {
  targets: { web: { enabled: true, providers: { build: 'expo', publish: 'eas' } } },
};

const CURRENT = {
  targets: { web: { providers: { build: 'expo', publish: 'eas' }, revision: 'rev-a' } },
} as const;

test('revision changes update an otherwise current target', () => {
  const [web] = createDeploymentChanges({
    desired: DESIRED,
    current: CURRENT,
    desiredRevisions: { web: 'rev-b' },
  });
  expect(web?.kind).toBe('update');
  expect(web?.reason).toBe('revision-changed');
});

test('matching revisions remain already current', () => {
  const [web] = createDeploymentChanges({
    desired: DESIRED,
    current: CURRENT,
    desiredRevisions: { web: 'rev-a' },
  });
  expect(web?.kind).toBe('none');
  expect(web?.reason).toBe('already-current');
});

test('omitted desired revision preserves configuration-only behavior', () => {
  const [web] = createDeploymentChanges({ desired: DESIRED, current: CURRENT });
  expect(web?.kind).toBe('none');
  expect(web?.reason).toBe('already-current');
});
