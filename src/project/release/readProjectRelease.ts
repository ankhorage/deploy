import { createReleaseRevision } from '../../domain/release/createReleaseRevision';
import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import { readJsonFile } from '../io/readJsonFile';
import { resolveProjectDeploymentPaths } from '../resolveProjectDeploymentPaths';
import { parseProjectRelease } from './parseProjectRelease';

export async function readProjectRelease(options: {
  readonly projectRoot: string;
}): Promise<ReleaseDesiredState> {
  const { releasePath } = resolveProjectDeploymentPaths(options.projectRoot);
  const parsed = parseProjectRelease(await readJsonFile(releasePath, 'Deploy release'));
  return {
    ...parsed,
    revision: createReleaseRevision(parsed),
  };
}
