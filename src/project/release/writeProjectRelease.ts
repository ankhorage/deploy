import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import { atomicWriteJson } from '../io/atomicWriteJson';
import { resolveProjectDeploymentPaths } from '../resolveProjectDeploymentPaths';
import { parseProjectRelease } from './parseProjectRelease';
import type { ProjectReleaseInput } from './ProjectReleaseInput';
import { readProjectRelease } from './readProjectRelease';

export async function writeProjectRelease(options: {
  readonly projectRoot: string;
  readonly release: ProjectReleaseInput;
}): Promise<ReleaseDesiredState> {
  const release = parseProjectRelease(options.release);
  const paths = resolveProjectDeploymentPaths(options.projectRoot);
  await atomicWriteJson({
    projectRoot: paths.projectRoot,
    filePath: paths.releasePath,
    value: release,
  });
  return readProjectRelease({ projectRoot: paths.projectRoot });
}
