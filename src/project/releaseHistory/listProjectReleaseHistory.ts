import { type Dirent, promises as fs } from 'node:fs';
import path from 'node:path';

import { isMissingPathError } from '../io/isMissingPathError';
import { resolveDeployProject } from '../resolveDeployProject';
import type { ProjectReleaseHistoryRecord } from './ProjectReleaseHistoryRecord';
import { readProjectReleaseHistory } from './readProjectReleaseHistory';

export async function listProjectReleaseHistory(options: {
  readonly projectRoot: string;
}): Promise<readonly ProjectReleaseHistoryRecord[]> {
  const project = await resolveDeployProject({ projectRoot: options.projectRoot });
  const releasesRoot = path.join(project.paths.historyRoot, 'releases');
  const entries = await readEntries(releasesRoot);
  const records = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) =>
        readProjectReleaseHistory({
          projectRoot: project.projectRoot,
          executionId: entry.name,
        }),
      ),
  );
  return records
    .filter((record): record is ProjectReleaseHistoryRecord => record !== null)
    .sort(compareRecords);
}

function compareRecords(
  left: ProjectReleaseHistoryRecord,
  right: ProjectReleaseHistoryRecord,
): number {
  const timestamp = left.recordedAt.localeCompare(right.recordedAt);
  return timestamp !== 0 ? timestamp : left.executionId.localeCompare(right.executionId);
}

async function readEntries(root: string): Promise<readonly Dirent[]> {
  try {
    return await fs.readdir(root, { withFileTypes: true });
  } catch (error) {
    if (isMissingPathError(error)) return [];
    throw error;
  }
}
