import { expect, test } from 'bun:test';

import { createStoreListingPlan } from './createStoreListingPlan';
import type { StoreListingDesiredState } from './StoreListingDesiredState';
import type { StoreListingTargetState } from './StoreListingTargetState';

const desired: StoreListingDesiredState = {
  revision: 'desired',
  locales: [{ locale: 'de-CH', name: 'Ankh', summary: 'Kurz' }],
  assetSets: [
    {
      target: 'android',
      locale: 'de-CH',
      variant: 'phone',
      assets: [
        {
          relativePath: 'deploy/assets/android/screenshots/de-CH/phone/01.png',
          sha256: 'sha',
          md5: 'md5',
          size: 1,
          mediaType: 'image/png',
        },
      ],
    },
  ],
};

const current: StoreListingTargetState = {
  target: 'android',
  locales: [{ locale: 'de-CH', name: 'Ankh', summary: 'Kurz' }],
  assetSets: [
    {
      target: 'android',
      locale: 'de-CH',
      variant: 'phone',
      checksum: 'sha256',
      hashes: ['sha'],
    },
  ],
  supportedFields: ['name', 'summary', 'description', 'promoVideoUrl'],
  diagnostics: [],
};

test('store listing plan is no-change for matching managed state', () => {
  const plan = createStoreListingPlan({ desired, currentRevision: 'current', states: [current] });
  expect(plan.status).toBe('no-change');
  expect(plan.steps).toEqual([]);
});

test('empty authored asset set plans deletion of a remote set', () => {
  const emptyDesired = { ...desired, assetSets: [{ ...desired.assetSets[0]!, assets: [] }] };
  const plan = createStoreListingPlan({
    desired: emptyDesired,
    currentRevision: 'current',
    states: [current],
  });
  expect(plan.steps.map((step) => step.operation)).toEqual(['replace-assets']);
});

test('error diagnostics block mutation planning', () => {
  const blocked = {
    ...current,
    diagnostics: [{ severity: 'error', code: 'X', message: 'blocked' }],
  } as const;
  expect(
    createStoreListingPlan({ desired, currentRevision: 'current', states: [blocked] }).status,
  ).toBe('blocked');
});
