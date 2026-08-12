import { promises as fs } from 'node:fs';

import type { AppDeployManifest } from '@ankhorage/contracts/deploy';
import { expect, test } from 'bun:test';

import { createTempProject, createTestManifest } from './manifestTestSupport.test';
import { readProjectDeploymentConfig } from './readProjectDeploymentConfig';

const ANDROID_DEPLOY: AppDeployManifest = {
  targets: {
    android: {
      enabled: true,
      package: 'com.example.app',
      providers: { build: 'eas', publish: 'google-play' },
    },
  },
};

test('reads only the canonical AppManifest.deploy subtree', async () => {
  const projectRoot = await createTempProject(createTestManifest(ANDROID_DEPLOY));
  try {
    expect(await readProjectDeploymentConfig({ projectRoot })).toEqual(ANDROID_DEPLOY);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});
