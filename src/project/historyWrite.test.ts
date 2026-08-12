import { expect, test } from 'bun:test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { createHistoryRecord } from './historyTestSupport.test';
import { listProjectDeploymentHistory } from './history/listProjectDeploymentHistory';
import { recordProjectDeploymentHistory } from './history/recordProjectDeploymentHistory';
import { createTempProject } from './manifestTestSupport.test';
import { resolveProjectDeploymentPaths } from './resolveProjectDeploymentPaths';

test('records and lists immutable deployment history deterministically', async () => {
  const projectRoot = await createTempProject();
  try {
    await recordProjectDeploymentHistory({ projectRoot, record: createHistoryRecord('002') });
    await recordProjectDeploymentHistory({ projectRoot, record: createHistoryRecord('001') });
    const records = await listProjectDeploymentHistory({ projectRoot });
    expect(records.map((record) => record.deploymentId)).toEqual(['001', '002']);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('duplicate history writes do not change the original record', async () => {
  const projectRoot = await createTempProject();
  const paths = resolveProjectDeploymentPaths(projectRoot);
  try {
    const record = createHistoryRecord('same-id');
    await recordProjectDeploymentHistory({ projectRoot, record });
    const recordPath = path.join(paths.historyRoot, 'same-id', 'deployment.json');
    const before = await fs.readFile(recordPath, 'utf8');
    await expect(recordProjectDeploymentHistory({ projectRoot, record })).rejects.toThrow(
      'already exists',
    );
    expect(await fs.readFile(recordPath, 'utf8')).toBe(before);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('history writer rejects extra credential payload fields', async () => {
  const projectRoot = await createTempProject();
  try {
    const record = {
      ...createHistoryRecord('no-secrets'),
      credentials: { token: 'must-not-persist' },
    };
    await expect(recordProjectDeploymentHistory({ projectRoot, record })).rejects.toThrow(
      'invalid canonical shape',
    );
    expect(await listProjectDeploymentHistory({ projectRoot })).toEqual([]);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});
