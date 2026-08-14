import { promises as fs } from 'node:fs';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { createReleasePlan } from '../domain/release/createReleasePlan';
import { createReleaseRevision } from '../domain/release/createReleaseRevision';
import type { ReleaseDesiredState } from '../domain/release/ReleaseDesiredState';
import type { ReleaseReconcileResult } from '../domain/release/ReleaseReconcileResult';
import { expectRejects } from './expectRejects.test';
import { createTempProject } from './manifestTestSupport.test';
import { createProjectReleaseHistoryRecord } from './releaseHistory/createProjectReleaseHistoryRecord';
import { listProjectReleaseHistory } from './releaseHistory/listProjectReleaseHistory';
import { recordProjectReleaseHistory } from './releaseHistory/recordProjectReleaseHistory';
import { resolveProjectDeploymentPaths } from './resolveProjectDeploymentPaths';

test('records release history immutably and deterministically', async () => {
  const projectRoot = await createTempProject();
  try {
    await recordProjectReleaseHistory({
      projectRoot,
      record: record('002', '2026-08-14T00:02:00.000Z'),
    });
    await recordProjectReleaseHistory({
      projectRoot,
      record: record('001', '2026-08-14T00:01:00.000Z'),
    });
    const records = await listProjectReleaseHistory({ projectRoot });
    expect(records.map((item) => item.executionId)).toEqual(['001', '002']);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('duplicate release history write preserves original bytes', async () => {
  const projectRoot = await createTempProject();
  const paths = resolveProjectDeploymentPaths(projectRoot);
  try {
    const value = record('same-id', '2026-08-14T00:00:00.000Z');
    await recordProjectReleaseHistory({ projectRoot, record: value });
    const recordPath = path.join(paths.historyRoot, 'releases', 'same-id', 'release.json');
    const before = await fs.readFile(recordPath, 'utf8');
    await expectRejects(
      recordProjectReleaseHistory({ projectRoot, record: value }),
      'already exists',
    );
    expect(await fs.readFile(recordPath, 'utf8')).toBe(before);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('release history writer rejects secret-like extra payload fields', async () => {
  const projectRoot = await createTempProject();
  try {
    const value = { ...record('no-secret', '2026-08-14T00:00:00.000Z'), token: 'SECRET' };
    await expectRejects(
      recordProjectReleaseHistory({ projectRoot, record: value }),
      'invalid canonical shape',
    );
    expect(await listProjectReleaseHistory({ projectRoot })).toEqual([]);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

function record(executionId: string, recordedAt: string) {
  const desired = desiredState();
  const initialPlan = createReleasePlan(desired, completedState());
  const result: ReleaseReconcileResult = {
    status: 'completed',
    plan: initialPlan,
    currentRevision: initialPlan.currentRevision,
    executedStepIds: [],
  };
  return createProjectReleaseHistoryRecord({
    executionId,
    recordedAt,
    desired,
    initialPlan,
    result,
  });
}

function desiredState(): ReleaseDesiredState {
  const base = {
    version: '2.1.0',
    targets: ['web'] as const,
    notes: [],
    rollout: { web: { mode: 'immediate' as const } },
  };
  return { ...base, revision: createReleaseRevision(base) };
}

function completedState() {
  return {
    targets: [{ target: 'web' as const, version: '2.1.0', artifactRevision: 'web-revision' }],
  };
}
