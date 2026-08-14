import { promises as fs } from 'node:fs';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { createTempProject, createTestManifest } from '../manifestTestSupport.test';
import { listProjectReleaseHistory } from '../releaseHistory/listProjectReleaseHistory';
import { createProjectWebDeploymentPlan } from '../web/createProjectWebDeploymentPlan';
import type { ProjectWebDeploymentInspection } from '../web/ProjectWebDeploymentInspection';
import { recordProjectWebDeployment } from '../web/recordProjectWebDeployment';
import { createProjectReleasePlan } from './createProjectReleasePlan';
import { defaultProjectReleaseRuntime } from './defaultProjectReleaseRuntime';
import { executeProjectReleaseWithRuntime } from './executeProjectReleaseWithRuntime';
import { inspectProjectReleaseWithRuntime } from './inspectProjectReleaseWithRuntime';

test('project release owner inspects no-change web release and records execution', async () => {
  const projectRoot = await createWebProject();
  try {
    await writeRelease(projectRoot, ['web']);
    await recordWebDeployment(projectRoot);
    const inspected = await inspectProjectReleaseWithRuntime(
      { projectRoot },
      defaultProjectReleaseRuntime,
    );
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;
    const plan = createProjectReleasePlan(inspected.inspection);
    expect(plan.status).toBe('no-change');
    const executed = await executeProjectReleaseWithRuntime(
      { inspection: inspected.inspection, plan, executionId: 'release-owner-1' },
      defaultProjectReleaseRuntime,
    );
    expect(executed.ok).toBe(true);
    if (!executed.ok) return;
    expect(executed.execution.result.status).toBe('completed');
    expect(executed.execution.historyRecorded).toBe(true);
    expect((await listProjectReleaseHistory({ projectRoot })).length).toBe(1);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('project release owner does not treat a Web preview as a production release', async () => {
  const projectRoot = await createWebProject();
  try {
    await writeRelease(projectRoot, ['web']);
    await recordWebDeployment(projectRoot, false);
    const inspected = await inspectProjectReleaseWithRuntime(
      { projectRoot },
      defaultProjectReleaseRuntime,
    );
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;
    const plan = createProjectReleasePlan(inspected.inspection);
    expect(plan.status).toBe('changes');
    expect(plan.steps.some((step) => step.id === 'web:publish')).toBe(true);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('project release owner requires explicit Android track context', async () => {
  const projectRoot = await createAndroidProject();
  try {
    await writeRelease(projectRoot, ['android']);
    const inspected = await inspectProjectReleaseWithRuntime(
      { projectRoot },
      defaultProjectReleaseRuntime,
    );
    expect(inspected.ok).toBe(false);
    if (inspected.ok) return;
    expect(inspected.failure.code).toBe('PROJECT_RELEASE_ANDROID_TRACK_REQUIRED');
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

function createWebProject(): Promise<string> {
  return createTempProject(createTestManifest({ targets: { web: { enabled: true } } }));
}

function createAndroidProject(): Promise<string> {
  return createTempProject(
    createTestManifest({
      targets: { android: { enabled: true, package: 'com.example.app' } },
    }),
  );
}

async function writeRelease(
  projectRoot: string,
  targets: readonly ('web' | 'android')[],
): Promise<void> {
  const deployRoot = path.join(projectRoot, 'deploy');
  await fs.mkdir(deployRoot, { recursive: true });
  await fs.writeFile(
    path.join(deployRoot, 'release.json'),
    `${JSON.stringify({
      version: '2.1.0',
      targets,
      notes: [],
      rollout: targets.includes('web')
        ? { web: { mode: 'immediate' } }
        : { android: { mode: 'immediate' } },
    })}\n`,
  );
}

async function recordWebDeployment(projectRoot: string, production = true): Promise<void> {
  const inspection: ProjectWebDeploymentInspection = {
    projectRoot,
    desired: { targets: { web: { enabled: true } } },
    current: { targets: {} },
    desiredRevision: 'a'.repeat(64),
    setup: null,
  };
  const plan = createProjectWebDeploymentPlan(inspection);
  const result = await recordProjectWebDeployment({
    inspection,
    plan,
    execution: { status: 'completed', records: [] },
    verification: { ok: true },
    publication: {
      target: 'web',
      revision: 'a'.repeat(64),
      provider: 'eas',
      deploymentId: 'web-test',
      url: 'https://example.test',
      production,
    },
    recordedAt: '2026-08-14T03:30:00.000Z',
  });
  expect(result.recorded).toBe(true);
}
