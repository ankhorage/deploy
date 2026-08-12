import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { AppDeployManifest } from '@ankhorage/contracts/deploy';
import { expect, test } from 'bun:test';

import { expectRejects } from './expectRejects.test';
import { createTempProject } from './manifestTestSupport.test';
import { resolveDeployProject } from './resolveDeployProject';
import { updateProjectDeploymentConfig } from './updateProjectDeploymentConfig';

const WEB_DEPLOY: AppDeployManifest = {
  targets: { web: { enabled: true, providers: { publish: 'eas' } } },
};

test('updates only canonical deployment config and writes deterministic JSON', async () => {
  const projectRoot = await createTempProject();
  try {
    const before = (await resolveDeployProject({ projectRoot })).manifest;
    await updateProjectDeploymentConfig({ projectRoot, update: () => WEB_DEPLOY });
    const afterProject = await resolveDeployProject({ projectRoot });
    expect(afterProject.deploy).toEqual(WEB_DEPLOY);
    expect(afterProject.manifest.metadata).toEqual(before.metadata);
    expect(afterProject.manifest.infra).toEqual(before.infra);
    const raw = await fs.readFile(path.join(projectRoot, 'ankh.config.json'), 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
    expect(raw).toContain('  "deploy": {');
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('removes the optional deploy subtree when updater returns null', async () => {
  const projectRoot = await createTempProject();
  try {
    await updateProjectDeploymentConfig({ projectRoot, update: () => WEB_DEPLOY });
    await updateProjectDeploymentConfig({ projectRoot, update: () => null });
    const project = await resolveDeployProject({ projectRoot });
    expect(project.deploy).toBeNull();
    expect('deploy' in project.manifest).toBe(false);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('invalid updater output is rejected before the manifest is written', async () => {
  const projectRoot = await createTempProject();
  const manifestPath = path.join(projectRoot, 'ankh.config.json');
  try {
    const original = await fs.readFile(manifestPath, 'utf8');
    const invalid = { targets: { web: { enabled: 'yes' } } } as unknown as AppDeployManifest;
    await expectRejects(
      updateProjectDeploymentConfig({ projectRoot, update: () => invalid }),
      'invalid canonical AppDeployManifest',
    );
    expect(await fs.readFile(manifestPath, 'utf8')).toBe(original);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});
