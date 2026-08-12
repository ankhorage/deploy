import path from 'node:path';

import { assertSafeSegment } from '../io/assertSafeSegment';
import { isMissingPathError } from '../io/isMissingPathError';
import { readJsonFile } from '../io/readJsonFile';
import { resolveDeployProject } from '../resolveDeployProject';
import { parseProjectDeploymentHistoryRecord } from './parseProjectDeploymentHistoryRecord';
import type { ProjectDeploymentHistoryRecord } from './ProjectDeploymentHistoryRecord';

export async function readProjectDeploymentHistory(options: {
  readonly projectRoot: string;
  readonly deploymentId: string;
}): Promise<ProjectDeploymentHistoryRecord | null> {
  assertSafeSegment(options.deploymentId, 'deployment id');
  const project = await resolveDeployProject({ projectRoot: options.projectRoot });
  const recordPath = path.join(
    project.paths.historyRoot,
    options.deploymentId,
    'deployment.json',
  );

  let parsed: unknown;
  try {
    parsed = await readJsonFile(recordPath, 'Deployment history record');
  } catch (error) {
    if (isMissingPathError(error)) return null;
    throw error;
  }

  const record = parseProjectDeploymentHistoryRecord(parsed);
  if (record.deploymentId !== options.deploymentId) {
    throw new Error(`Deployment history id does not match its directory: ${options.deploymentId}`);
  }
  return record;
}
