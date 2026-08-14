import { promises as fs } from 'node:fs';
import path from 'node:path';

import { assertContainedWritePath } from '../io/assertContainedPath';
import { assertSafeSegment } from '../io/assertSafeSegment';
import { atomicWriteJson } from '../io/atomicWriteJson';
import { resolveDeployProject } from '../resolveDeployProject';
import { parseProjectReleaseHistoryRecord } from './parseProjectReleaseHistoryRecord';
import type { ProjectReleaseHistoryRecord } from './ProjectReleaseHistoryRecord';

export async function recordProjectReleaseHistory(options: {
  readonly projectRoot: string;
  readonly record: ProjectReleaseHistoryRecord;
}): Promise<void> {
  const record = parseProjectReleaseHistoryRecord(options.record);
  assertSafeSegment(record.executionId, 'release execution id');
  const project = await resolveDeployProject({ projectRoot: options.projectRoot });
  const releasesRoot = path.join(project.paths.historyRoot, 'releases');
  const recordRoot = path.join(releasesRoot, record.executionId);
  const recordPath = path.join(recordRoot, 'release.json');
  await assertContainedWritePath(project.projectRoot, recordPath);
  await fs.mkdir(releasesRoot, { recursive: true });
  await createRecordDirectory(recordRoot, record.executionId);
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

async function createRecordDirectory(recordRoot: string, executionId: string): Promise<void> {
  try {
    await fs.mkdir(recordRoot);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      throw new Error(`Release history already exists: ${executionId}`, { cause: error });
    }
    throw error;
  }
}
