import type { AppDeployManifest } from '@ankhorage/contracts/deploy';
import { expect, test } from 'bun:test';

import type { DeploymentCurrentState } from '../domain/DeploymentCurrentState';
import { createDeploymentChanges } from './createDeploymentChanges';

const emptyCurrent: DeploymentCurrentState = { targets: {} };

function matchingMobileDesired(): AppDeployManifest {
  return {
    targets: {
      android: {
        enabled: true,
        package: 'com.example.app',
        providers: { build: 'eas', publish: 'google-play' },
      },
      ios: {
        enabled: true,
        bundleIdentifier: 'com.example.app',
        providers: { build: 'eas', publish: 'app-store-connect' },
      },
    },
  };
}

function matchingMobileCurrent(): DeploymentCurrentState {
  return {
    targets: {
      android: {
        package: 'com.example.app',
        providers: { publish: 'google-play', build: 'eas' },
      },
      ios: {
        bundleIdentifier: 'com.example.app',
        providers: { publish: 'app-store-connect', build: 'eas' },
      },
    },
  };
}

test('deployment changes use canonical web, android, ios order', () => {
  const desired: AppDeployManifest = {
    targets: {
      ios: { enabled: false, bundleIdentifier: 'com.example.app' },
      web: { enabled: false },
      android: { enabled: false, package: 'com.example.app' },
    },
  };

  const changes = createDeploymentChanges({ desired, current: emptyCurrent });

  expect(changes.map(({ target }) => target)).toEqual(['web', 'android', 'ios']);
  expect(changes.map(({ kind }) => kind)).toEqual(['none', 'none', 'none']);
});

test('deployment changes create an enabled target that is absent', () => {
  const desired: AppDeployManifest = {
    targets: { web: { enabled: true, providers: { publish: 'eas' } } },
  };

  const [web] = createDeploymentChanges({ desired, current: emptyCurrent });

  expect(web?.kind).toBe('create');
  expect(web?.reason).toBe('target-missing');
  expect(web?.desired).toEqual({ target: 'web', providers: { publish: 'eas' } });
});

test('deployment changes remove omitted or disabled current targets', () => {
  const desired: AppDeployManifest = {
    targets: { android: { enabled: false, package: 'com.example.app' } },
  };
  const current: DeploymentCurrentState = {
    targets: {
      android: { package: 'com.example.app', providers: { publish: 'google-play' } },
      web: { providers: { publish: 'eas' } },
    },
  };

  const changes = createDeploymentChanges({ desired, current });

  expect(changes[0]?.kind).toBe('remove');
  expect(changes[1]?.kind).toBe('remove');
  expect(changes[1]?.reason).toBe('target-not-desired');
});

test('deployment changes return none for equal normalized state', () => {
  const changes = createDeploymentChanges({
    desired: matchingMobileDesired(),
    current: matchingMobileCurrent(),
  });

  expect(changes[1]?.kind).toBe('none');
  expect(changes[2]?.kind).toBe('none');
  expect(changes[2]?.reason).toBe('already-current');
});

test('deployment changes update provider or platform identity differences', () => {
  const desired: AppDeployManifest = {
    targets: {
      web: { enabled: true, providers: { publish: 'next-host' } },
      android: { enabled: true, package: 'com.new.app' },
      ios: { enabled: true, bundleIdentifier: 'com.new.app' },
    },
  };
  const current: DeploymentCurrentState = {
    targets: {
      web: { providers: { publish: 'old-host' } },
      android: { package: 'com.old.app' },
      ios: { bundleIdentifier: 'com.old.app' },
    },
  };

  const changes = createDeploymentChanges({ desired, current });

  expect(changes.map(({ kind }) => kind)).toEqual(['update', 'update', 'update']);
  expect(changes.every(({ reason }) => reason === 'configuration-changed')).toBe(true);
});

test('deployment diffing does not mutate desired or current inputs', () => {
  const desired: AppDeployManifest = {
    targets: { web: { enabled: true, providers: { publish: 'eas' } } },
  };
  const current: DeploymentCurrentState = {
    targets: { web: { providers: { publish: 'eas' } } },
  };
  const desiredBefore = structuredClone(desired);
  const currentBefore = structuredClone(current);

  createDeploymentChanges({ desired, current });

  expect(desired).toEqual(desiredBefore);
  expect(current).toEqual(currentBefore);
});
