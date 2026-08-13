import { expect, test } from 'bun:test';

import type { StoreListingDesiredState } from './StoreListingDesiredState';
import type { StoreListingTargetCurrentState } from './StoreListingCurrentState';
import { createStoreListingPlan } from './createStoreListingPlan';
import { normalizeStoreListingLocale } from './normalizeStoreListingLocale';

const desired: StoreListingDesiredState = {
  revision: 'rev',
  locales: [{ locale: 'de-CH', name: 'App', summary: 'Kurz' }],
  assets: [
    {
      target: 'android',
      kind: 'screenshot',
      locale: 'de-CH',
      variant: 'phone',
      relativePath: 'deploy/assets/android/screenshots/de-CH/phone/1.png',
      sha256: 'sha',
      md5: 'md5',
      size: 1,
    },
  ],
};

const current: StoreListingTargetCurrentState = {
  target: 'android',
  supportedFields: ['name', 'summary'],
  locales: [{ locale: 'de-CH', name: 'App', summary: 'Kurz' }],
  assets: [
    {
      ...desired.assets[0]!,
      remoteChecksum: 'sha',
      checksumAlgorithm: 'sha256',
    },
  ],
};

test('normalizes authored locales with BCP-47 casing', () => {
  expect(normalizeStoreListingLocale('de-ch')).toBe('de-CH');
  expect(normalizeStoreListingLocale('de_CH')).toBeNull();
});

test('creates deterministic no-change listing operations', () => {
  const plan = createStoreListingPlan({ desired, current: [current] });
  expect(plan.hasChanges).toBe(false);
  expect(plan.operations.map((operation) => operation.action)).toEqual(['no-change', 'no-change']);
});

test('distinguishes metadata update and asset replacement', () => {
  const changed: StoreListingTargetCurrentState = {
    ...current,
    locales: [{ locale: 'de-CH', name: 'Old', summary: 'Kurz' }],
    assets: [{ ...current.assets[0]!, remoteChecksum: 'other' }],
  };
  const plan = createStoreListingPlan({ desired, current: [changed] });
  expect(plan.operations.map((operation) => operation.action)).toEqual(['update', 'update']);
});
