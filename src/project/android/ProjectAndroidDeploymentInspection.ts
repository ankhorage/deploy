import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { AndroidDeploymentIntent } from '../../domain/AndroidDeploymentIntent';
import type { DeploymentCurrentState } from '../../domain/DeploymentCurrentState';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';

export interface ProjectAndroidDeploymentInspection {
  readonly projectRoot: string;
  readonly desired: AppDeployManifest;
  readonly current: DeploymentCurrentState;
  readonly intent: AndroidDeploymentIntent;
  readonly desiredRevision?: string;
  readonly setups: readonly DeploymentProviderSetupInspectionResult[];
}

export type ProjectAndroidDeploymentInspectionResult =
  | { readonly ok: true; readonly inspection: ProjectAndroidDeploymentInspection }
  | { readonly ok: false; readonly failure: DeploymentFailure };
