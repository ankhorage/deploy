import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { expectRejects } from './expectRejects.test';
import { createTempProject } from './manifestTestSupport.test';
import { resolveDeployProject } from './resolveDeployProject';

test('resolves an explicit canonical project root without synthesizing deploy config', async () => {
  const projectRoot = await createTempProject();
  try {
    const project = await resolveDeployProject({ projectRoot });
    expect(project.projectRoot).toBe(await fs.realpath(projectRoot));
    expect(project.deploy).toBeNull();
    expect(project.manifestPath).toBe(path.join(project.projectRoot, 'ankh.config.json'));
    expect(project.paths.authoredRoot).toBe(path.join(project.projectRoot, 'deploy'));
    expect(project.paths.historyRoot).toBe(path.join(project.projectRoot, '.ankh', 'deployments'));
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('rejects a missing canonical project manifest', async () => {
  const projectRoot = await fs.mkdtemp(path.join(tmpdir(), 'ankh-deploy-missing-'));
  try {
    await expectRejects(
      resolveDeployProject({ projectRoot }),
      'Deploy project manifest does not exist',
    );
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('rejects malformed project manifest JSON distinctly', async () => {
  const projectRoot = await createTempProject();
  try {
    await fs.writeFile(path.join(projectRoot, 'ankh.config.json'), '{broken');
    await expectRejects(resolveDeployProject({ projectRoot }), 'is not valid JSON');
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('rejects structurally invalid project manifests through Contracts', async () => {
  const projectRoot = await createTempProject();
  try {
    await fs.writeFile(path.join(projectRoot, 'ankh.config.json'), '{}\n');
    await expectRejects(resolveDeployProject({ projectRoot }), 'invalid canonical shape');
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});
