import { normalizeProjectRoot } from './io/normalizeProjectRoot';
import { readProjectManifest } from './io/readProjectManifest';
import type { ResolvedDeployProject } from './ResolvedDeployProject';
import { resolveProjectDeploymentPaths } from './resolveProjectDeploymentPaths';

export async function resolveDeployProject(options: {
  readonly projectRoot: string;
}): Promise<ResolvedDeployProject> {
  const projectRoot = await normalizeProjectRoot(options.projectRoot);
  const { manifest, manifestPath } = await readProjectManifest(projectRoot);

  return {
    projectRoot,
    manifestPath,
    manifest,
    deploy: manifest.deploy ?? null,
    paths: resolveProjectDeploymentPaths(projectRoot),
  };
}
