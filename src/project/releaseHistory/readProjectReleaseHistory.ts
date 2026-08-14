import path from 'node:path';

import { assertSafeSegment } from '../io/assertSafeSegment';
import { isMissingPathError } from '../io/isMissingPathError';
import { readJsonFile } from '../io/readJsonFile';
import { resolveDeployProject } from '../resolveDeployProject';
import { parseProjectReleaseHistoryRecord } from './parseProjectReleaseHistoryRecord';
import type { ProjectReleaseHistoryRecord } from './ProjectReleaseHistoryRecord';

export async function readProjectReleaseHistory(options: {
  readonly projectRoot: string;
  readonly executionId: string;
}): Promise<ProjectReleaseHistoryRecord | null> {
  assertSafeSegment(options.executionId, 'release execution id');
  const project = await resolveDeployProject({ projectRoot: options.projectRoot });
  const recordPath = path.join(
    project.paths.historyRoot,
    'releases',
    options.executionId,
    'release.json',
  );
  let parsed: unknown;
  try {
    parsed = await readJsonFile(recordPath, 'Release history record');
  } catch (error) {
    if (isMissingPathError(error)) return null;
    throw error;
  }
  const record = parseProjectReleaseHistoryRecord(parsed);
  if (record.executionId !== options.executionId) {
    throw new Error(`Release history id does not match its directory: ${options.executionId}`);
  }
  return record;
}
