import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { AppManifest } from '@ankhorage/contracts';
import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

export function createTestManifest(deploy?: AppDeployManifest): AppManifest {
  const manifest: AppManifest = {
    metadata: {
      name: 'Deploy Test',
      slug: 'deploy-test',
      version: '1.0.0',
      category: 'developer_tools',
      themeId: 'default',
    },
    themes: [],
    activeThemeId: 'default',
    infra: { modules: [] },
    navigator: {
      type: 'stack',
      routes: [{ name: 'index', screenId: 'index' }],
    },
    screens: {},
    settings: {
      localization: {
        defaultLocale: 'en',
        locales: ['en'],
      },
    },
  };
  return deploy === undefined ? manifest : { ...manifest, deploy };
}

export async function createTempProject(manifest = createTestManifest()): Promise<string> {
  const projectRoot = await fs.mkdtemp(path.join(tmpdir(), 'ankh-deploy-project-'));
  await fs.writeFile(
    path.join(projectRoot, 'ankh.config.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return projectRoot;
}
