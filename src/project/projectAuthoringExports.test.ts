import { expect, test } from 'bun:test';

import {
  readProjectStoreListing,
  removeProjectStoreListingAsset,
  removeProjectStoreListingLocale,
  writeProjectMonetization,
  writeProjectRelease,
  writeProjectStoreListingAsset,
  writeProjectStoreListingLocale,
} from './index';

test('project entrypoint intentionally exposes Deploy authoring owner APIs', () => {
  expect(typeof readProjectStoreListing).toBe('function');
  expect(typeof writeProjectStoreListingLocale).toBe('function');
  expect(typeof removeProjectStoreListingLocale).toBe('function');
  expect(typeof writeProjectStoreListingAsset).toBe('function');
  expect(typeof removeProjectStoreListingAsset).toBe('function');
  expect(typeof writeProjectMonetization).toBe('function');
  expect(typeof writeProjectRelease).toBe('function');
});
