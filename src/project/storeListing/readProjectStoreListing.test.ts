import { expect, test } from 'bun:test';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { readProjectStoreListing } from './readProjectStoreListing';

async function createProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'ankh-deploy-listing-'));
  await fs.mkdir(path.join(root, 'deploy', 'listing'), { recursive: true });
  await fs.mkdir(path.join(root, 'deploy', 'assets', 'android', 'screenshots', 'de-CH', 'phone'), { recursive: true });
  await fs.writeFile(path.join(root, 'deploy', 'listing', 'de-ch.json'), JSON.stringify({ locale: 'de-CH', name: 'Demo', summary: 'Kurz' }));
  await fs.writeFile(path.join(root, 'deploy', 'assets', 'android', 'screenshots', 'de-CH', 'phone', '01.png'), Buffer.from('image'));
  return root;
}

test('reads locales and file-backed assets deterministically', async () => {
  const root = await createProject();
  try {
    const result = await readProjectStoreListing(root);
    expect(result.locales).toEqual([{ locale: 'de-CH', name: 'Demo', summary: 'Kurz' }]);
    expect(result.assets[0]?.relativePath).toBe('deploy/assets/android/screenshots/de-CH/phone/01.png');
    expect(result.revision).toHaveLength(64);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('rejects unknown listing keys', async () => {
  const root = await createProject();
  try {
    await fs.writeFile(path.join(root, 'deploy', 'listing', 'de-ch.json'), JSON.stringify({ name: 'Demo', unknown: true }));
    expect(readProjectStoreListing(root)).rejects.toThrow('Invalid store listing locale');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
