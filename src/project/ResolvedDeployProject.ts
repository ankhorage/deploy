import type { AppManifest } from '@ankhorage/contracts';
import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { ProjectDeploymentPaths } from './ProjectDeploymentPaths';

export interface ResolvedDeployProject {
  readonly projectRoot: string;
  readonly manifestPath: string;
  readonly manifest: AppManifest;
  readonly deploy: AppDeployManifest | null;
  readonly paths: ProjectDeploymentPaths;
}
