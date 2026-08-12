import {
  isAppDeployManifest,
  type AppDeployManifest,
} from '@ankhorage/contracts/deploy';

import { atomicWriteJson } from './io/atomicWriteJson';
import { resolveDeployProject } from './resolveDeployProject';

export type ProjectDeploymentConfigUpdater = (
  current: AppDeployManifest | null,
) => AppDeployManifest | null;

export async function updateProjectDeploymentConfig(options: {
  readonly projectRoot: string;
  readonly update: ProjectDeploymentConfigUpdater;
}): Promise<AppDeployManifest | null> {
  const project = await resolveDeployProject({ projectRoot: options.projectRoot });
  const current = project.deploy === null ? null : structuredClone(project.deploy);
  const next = options.update(current);

  if (next !== null && !isAppDeployManifest(next)) {
    throw new Error('Deployment config update returned an invalid canonical AppDeployManifest.');
  }

  const nextManifest = { ...project.manifest };
  if (next === null) delete nextManifest.deploy;
  else nextManifest.deploy = next;

  await atomicWriteJson({
    projectRoot: project.projectRoot,
    filePath: project.manifestPath,
    value: nextManifest,
  });

  return next;
}
