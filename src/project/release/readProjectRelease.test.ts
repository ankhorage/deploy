import { promises as fs } from 'node:fs';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { createTempProject } from '../manifestTestSupport.test';
import { readProjectRelease } from './readProjectRelease';

test('reads and canonicalizes release authoring deterministically', async () => {
  const projectRoot = await createTempProject();
  try {
    await writeRelease(projectRoot, {
      version: '2.1.0',
      targets: ['ios', 'android'],
      notes: [
        { locale: 'de-ch', text: 'Neu' },
        { locale: 'en-us', text: 'New' },
      ],
      rollout: {
        android: { mode: 'staged', initialFraction: '0.1000' },
        ios: { mode: 'staged' },
      },
    });
    const release = await readProjectRelease({ projectRoot });
    expect(release.targets).toEqual(['android', 'ios']);
    expect(release.notes.map((note) => note.locale)).toEqual(['de-CH', 'en-US']);
    expect(release.rollout.android).toEqual({ mode: 'staged', initialFraction: '0.1' });
    expect(release.rollout.ios).toEqual({ mode: 'staged' });
    expect(release.revision).toHaveLength(64);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('rejects target-specific rollout shapes that cannot be represented safely', async () => {
  const projectRoot = await createTempProject();
  try {
    await writeRelease(projectRoot, {
      version: '2.1.0',
      targets: ['ios'],
      notes: [],
      rollout: { ios: { mode: 'staged', initialFraction: '0.1' } },
    });
    expect(readProjectRelease({ projectRoot })).rejects.toThrow('RELEASE_INVALID');
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('rejects unknown release fields and duplicate targets', async () => {
  const projectRoot = await createTempProject();
  try {
    await writeRelease(projectRoot, {
      version: '2.1.0',
      targets: ['android', 'android'],
      notes: [],
      rollout: {},
      providerId: 'leak',
    });
    expect(readProjectRelease({ projectRoot })).rejects.toThrow('RELEASE_INVALID');
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

async function writeRelease(projectRoot: string, value: unknown): Promise<void> {
  const directory = path.join(projectRoot, 'deploy');
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'release.json'), `${JSON.stringify(value, null, 2)}\n`);
}
