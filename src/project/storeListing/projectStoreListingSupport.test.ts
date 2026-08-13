import { expect, test } from 'bun:test';

import { projectStoreListingRuntime } from './ProjectStoreListingRuntime';
import { resolveProjectStoreListingAccess } from './resolveProjectStoreListingAccess';
import { resolveProjectStoreListingTargets } from './resolveProjectStoreListingTargets';
import { toStoreListingDesiredState } from './toStoreListingDesiredState';

test('project store listing helpers normalize access, targets, assets, and runtime', () => {
  const access = resolveProjectStoreListingAccess({});
  expect(access.credentials).toEqual([]);

  const targets = resolveProjectStoreListingTargets({
    android: { enabled: true, package: 'com.example.app' },
    ios: { enabled: true, bundleIdentifier: 'com.example.app' },
  });
  expect(targets).toEqual({
    androidPackageName: 'com.example.app',
    iosBundleIdentifier: 'com.example.app',
  });

  const desired = toStoreListingDesiredState({
    revision: 'revision',
    locales: [{ locale: 'de-CH', name: 'Ankh' }],
    assetSets: [
      {
        target: 'android',
        locale: 'de-CH',
        variant: 'phone',
        assets: [
          {
            sourcePath: '/tmp/01.png',
            relativePath: 'deploy/assets/android/screenshots/de-CH/phone/01.png',
            sha256: 'sha',
            md5: 'md5',
            size: 1,
            mediaType: 'image/png',
          },
        ],
      },
    ],
  });

  expect(desired.assetSets[0]?.assets[0]).toEqual({
    relativePath: 'deploy/assets/android/screenshots/de-CH/phone/01.png',
    sha256: 'sha',
    md5: 'md5',
    size: 1,
    mediaType: 'image/png',
  });
  expect(projectStoreListingRuntime.maxAppStoreProcessingAttempts).toBe(120);
});
