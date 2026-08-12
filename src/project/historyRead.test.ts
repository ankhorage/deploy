import { expect, test } from 'bun:test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { createHistoryRecord } from './historyTestSupport.test';
import { readProjectDeploymentHistory } from './history/readProjectDeploymentHistory';
import { recordProjectDeploymentHistory } from './history/recordProjectDeploymentHistory';
import { createTempProject } from './manifestTestSupport.test';
import { resolveProjectDeploymentPaths } from './resolveProjectDeploymentPaths';

test('reads a canonical history record', async () => {
  const projectRoot = await createTempProject();
  try {
    await recordProjectDeploymentHistory({
      projectRoot,
      record: createHistoryRecord('read-me'),
    });
    const record = await readProjectDeploymentHistory({
      projectRoot,
      deploymentId: 'read-me',
    });
    expect(record?.verification).toEqual({ ok: true });
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('rejects unsupported history schema versions', async () => {
  const projectRoot = await createTempProject();
  const paths = resolveProjectDeploymentPaths(projectRoot);
  try {
    const recordRoot = path.join(paths.historyRoot, 'unsupported');
    await fs.mkdir(recordRoot, { recursive: true });
    await fs.writeFile(
      path.join(recordRoot, 'deployment.json'),
      `${JSON.stringify({ ...createHistoryRecord('unsupported'), schemaVersion: 2 })}\n`,
    );
    await expect(
      readProjectDeploymentHistory({ projectRoot, deploymentId: 'unsupported' }),
    ).rejects.toThrow('Unsupported deployment history schema version');
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('rejects unsafe history ids before filesystem access', async () => {
  const projectRoot = await createTempProject();
  try {
    await expect(
      readProjectDeploymentHistory({ projectRoot, deploymentId: '../outside' }),
    ).rejects.toThrow('one safe path segment');
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});
