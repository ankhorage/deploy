import { promises as fs } from 'node:fs';
import path from 'node:path';

import { assertContainedWritePath } from '../io/assertContainedPath';
import { atomicWriteJson } from '../io/atomicWriteJson';
import { assertSafeSegment } from '../io/assertSafeSegment';
import { resolveDeployProject } from '../resolveDeployProject';
import { parseProjectDeploymentHistoryRecord } from './parseProjectDeploymentHistoryRecord';
import type { ProjectDeploymentHistoryRecord } from './ProjectDeploymentHistoryRecord';

export async function recordProjectDeploymentHistory(options: {
  readonly projectRoot: string;
  readonly record: ProjectDeploymentHistoryRecord;
}): Promise<void> {
  const record = parseProjectDeploymentHistoryRecord(options.record);
  assertSafeSegment(record.deploymentId, 'deployment id');

  const project = await resolveDeployProject({ projectRoot: options.projectRoot });
  const recordRoot = path.join(project.paths.historyRoot, record.deploymentId);
  const recordPath = path.join(recordRoot, 'deployment.json');
  await assertContainedWritePath(project.projectRoot, recordPath);
  await fs.mkdir(project.paths.historyRoot, { recursive: true });
  await createRecordDirectory(recordRoot, record.deploymentId);

  try {
    await atomicWriteJson({
      projectRoot: project.projectRoot,
      filePath: recordPath,
      value: record,
    });
  } catch (error) {
    await fs.rm(recordRoot, { recursive: true, force: true });
    throw error;
  }
}

async function createRecordDirectory(recordRoot: string, deploymentId: string): Promise<void> {
  try {
    await fs.mkdir(recordRoot);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      throw new Error(`Deployment history already exists: ${deploymentId}`, { cause: error });
    }
    throw error;
  }
}
