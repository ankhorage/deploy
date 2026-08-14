import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { expectRejects } from '../expectRejects.test';
import { readProjectRelease } from './readProjectRelease';
import { writeProjectRelease } from './writeProjectRelease';

test('prepared release authoring validates, normalizes, persists, and revises', async () => {
  const root = await createRoot();
  try {
    const written = await writeProjectRelease({
      projectRoot: root,
      release: {
        version: '1.2.3',
        targets: ['web', 'ios'],
        notes: [{ locale: 'en-us', text: 'First release' }],
        rollout: {
          web: { mode: 'immediate' },
          ios: { mode: 'staged' },
        },
      },
    });

    expect(written).toMatchObject({
      version: '1.2.3',
      targets: ['ios', 'web'],
      notes: [{ locale: 'en-US', text: 'First release' }],
    });
    expect(written.revision.length).toBeGreaterThan(0);
    expect(await readProjectRelease({ projectRoot: root })).toEqual(written);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('invalid prepared release is rejected before replacing canonical state', async () => {
  const root = await createRoot();
  try {
    const initial = await writeProjectRelease({
      projectRoot: root,
      release: {
        version: '1.0.0',
        targets: ['web'],
        notes: [],
        rollout: { web: { mode: 'immediate' } },
      },
    });
    await expectRejects(
      writeProjectRelease({
        projectRoot: root,
        release: {
          version: 'v2',
          targets: ['web'],
          notes: [],
          rollout: { web: { mode: 'immediate' } },
        },
      }),
      'RELEASE_INVALID',
    );

    expect(await readProjectRelease({ projectRoot: root })).toEqual(initial);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

async function createRoot(): Promise<string> {
  return fs.mkdtemp(path.join(tmpdir(), 'ankh-deploy-release-authoring-'));
}
