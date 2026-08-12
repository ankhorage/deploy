import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import { resolveDeployProject } from './resolveDeployProject';

export async function readProjectDeploymentConfig(options: {
  readonly projectRoot: string;
}): Promise<AppDeployManifest | null> {
  const project = await resolveDeployProject(options);
  return project.deploy;
}
