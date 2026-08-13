import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { readProjectStoreListing } from './readProjectStoreListing';

test('reads locales, projects shared Android assets, and preserves empty screenshot sets', async () => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'ankh-listing-'));
  try {
    await fs.mkdir(path.join(root, 'deploy/listing'), { recursive: true });
    await fs.mkdir(path.join(root, 'deploy/assets/android/screenshots/de-CH/phone'), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(root, 'deploy/listing/de-ch.json'),
      JSON.stringify({ name: 'Ankh' }),
    );
    await fs.writeFile(path.join(root, 'deploy/assets/android/icon.png'), 'icon');
    const listing = await readProjectStoreListing({ projectRoot: root });
    expect(listing.locales[0]?.locale).toBe('de-CH');
    expect(listing.assetSets.map((set) => [set.locale, set.variant, set.assets.length])).toEqual([
      ['de-CH', 'icon', 1],
      ['de-CH', 'phone', 0],
    ]);
    expect(listing.revision).toHaveLength(64);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('rejects screenshot assets for a locale without authored listing metadata', async () => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'ankh-listing-'));
  try {
    await fs.mkdir(path.join(root, 'deploy/assets/ios/screenshots/fr-FR/APP_IPHONE_67'), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(root, 'deploy/assets/ios/screenshots/fr-FR/APP_IPHONE_67/01.png'),
      'png',
    );
    await expect(readProjectStoreListing({ projectRoot: root })).rejects.toThrow(
      'STORE_LISTING_ASSET_LOCALE_UNKNOWN',
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
