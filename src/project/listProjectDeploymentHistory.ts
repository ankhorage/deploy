import { type Dirent, promises as fs } from 'node:fs';

import type { ProjectDeploymentHistoryRecord } from './history/ProjectDeploymentHistoryRecord';
import { isMissingPathError } from './io/isMissingPathError';
import { readProjectDeploymentHistory } from './readProjectDeploymentHistory';
import { resolveDeployProject } from './resolveDeployProject';

/*** List canonical deployment history records for one validated Deploy project. */
export async function listProjectDeploymentHistory(options: {
  readonly projectRoot: string;
}): Promise<readonly ProjectDeploymentHistoryRecord[]> {
  const project = await resolveDeployProject({ projectRoot: options.projectRoot });
  const entries = await readHistoryEntries(project.paths.historyRoot);
  const ids = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const records = await Promise.all(
    ids.map((deploymentId) =>
      readProjectDeploymentHistory({ projectRoot: project.projectRoot, deploymentId }),
    ),
  );
  return records.filter((record): record is ProjectDeploymentHistoryRecord => record !== null);
}

async function readHistoryEntries(historyRoot: string): Promise<readonly Dirent[]> {
  try {
    return await fs.readdir(historyRoot, { withFileTypes: true });
  } catch (error) {
    if (isMissingPathError(error)) return [];
    throw error;
  }
}
