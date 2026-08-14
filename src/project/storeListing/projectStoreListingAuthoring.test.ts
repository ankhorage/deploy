import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { expectRejects } from '../expectRejects.test';
import { readProjectStoreListing } from './readProjectStoreListing';
import { removeProjectStoreListingAsset } from './removeProjectStoreListingAsset';
import { removeProjectStoreListingLocale } from './removeProjectStoreListingLocale';
import { writeProjectStoreListingAsset } from './writeProjectStoreListingAsset';
import { writeProjectStoreListingLocale } from './writeProjectStoreListingLocale';

test('store listing authoring round-trips normalized locales and preserves siblings', async () => {
  const root = await createRoot();
  try {
    await writeProjectStoreListingLocale({
      projectRoot: root,
      locale: { locale: 'en-us', name: 'English', summary: 'Initial' },
    });
    await writeProjectStoreListingLocale({
      projectRoot: root,
      locale: { locale: 'de-CH', name: 'Deutsch' },
    });
    const updated = await writeProjectStoreListingLocale({
      projectRoot: root,
      locale: { locale: 'en-US', name: 'English', summary: 'Updated' },
    });

    expect(updated.locales).toEqual([
      { locale: 'de-CH', name: 'Deutsch' },
      { locale: 'en-US', name: 'English', summary: 'Updated' },
    ]);
    expect(await exists(path.join(root, 'deploy/listing/en-US.json'))).toBeTrue();
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('store listing asset writes are semantic, path-safe, and removable', async () => {
  const root = await createRoot();
  try {
    await writeProjectStoreListingLocale({
      projectRoot: root,
      locale: { locale: 'en-US', name: 'English' },
    });
    const written = await writeProjectStoreListingAsset({
      projectRoot: root,
      location: {
        kind: 'screenshot',
        target: 'ios',
        locale: 'en-us',
        variant: 'iphone-67',
        filename: '01.png',
      },
      data: pngBytes(),
    });

    expect(written.assetSets[0]?.assets).toHaveLength(1);
    const removed = await removeProjectStoreListingAsset({
      projectRoot: root,
      location: {
        kind: 'screenshot',
        target: 'ios',
        locale: 'en-US',
        variant: 'iphone-67',
        filename: '01.png',
      },
    });
    expect(removed.assetSets).toEqual([]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('removing a listing locale also removes its screenshot sets', async () => {
  const root = await createRoot();
  try {
    await writeProjectStoreListingLocale({
      projectRoot: root,
      locale: { locale: 'en-US', name: 'English' },
    });
    await writeProjectStoreListingLocale({
      projectRoot: root,
      locale: { locale: 'de-CH', name: 'Deutsch' },
    });
    await writeProjectStoreListingAsset({
      projectRoot: root,
      location: {
        kind: 'screenshot',
        target: 'android',
        locale: 'en-US',
        variant: 'phone',
        filename: '01.jpg',
      },
      data: jpegBytes(),
    });

    const result = await removeProjectStoreListingLocale({ projectRoot: root, locale: 'en-us' });
    expect(result.locales).toEqual([{ locale: 'de-CH', name: 'Deutsch' }]);
    expect(result.assetSets).toEqual([]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('store listing asset authoring rejects traversal and unsupported bytes', async () => {
  const root = await createRoot();
  try {
    await writeProjectStoreListingLocale({
      projectRoot: root,
      locale: { locale: 'en-US', name: 'English' },
    });
    await expectRejects(
      writeProjectStoreListingAsset({
        projectRoot: root,
        location: {
          kind: 'screenshot',
          target: 'android',
          locale: 'en-US',
          variant: '../escape',
          filename: '01.png',
        },
        data: pngBytes(),
      }),
      'STORE_LISTING_ASSET_PATH_INVALID',
    );
    await expectRejects(
      writeProjectStoreListingAsset({
        projectRoot: root,
        location: {
          kind: 'screenshot',
          target: 'android',
          locale: 'en-US',
          variant: 'phone',
          filename: 'fake.png',
        },
        data: jpegBytes(),
      }),
      'STORE_LISTING_ASSET_TYPE_UNSUPPORTED',
    );
    expect((await readProjectStoreListing({ projectRoot: root })).assetSets).toEqual([]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

async function createRoot(): Promise<string> {
  return fs.mkdtemp(path.join(tmpdir(), 'ankh-deploy-listing-authoring-'));
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function pngBytes(): Uint8Array {
  return Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
}

function jpegBytes(): Uint8Array {
  return Uint8Array.from([0xff, 0xd8, 0xff, 0x00]);
}
