import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { DeploymentCurrentState } from '../../domain/DeploymentCurrentState';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import type { IosDeploymentIntent } from '../../domain/IosDeploymentIntent';

export interface ProjectIosDeploymentInspection {
  readonly projectRoot: string;
  readonly desired: AppDeployManifest;
  readonly current: DeploymentCurrentState;
  readonly intent: IosDeploymentIntent;
  readonly desiredRevision?: string;
  readonly setups: readonly DeploymentProviderSetupInspectionResult[];
}

export type ProjectIosDeploymentInspectionResult =
  | { readonly ok: true; readonly inspection: ProjectIosDeploymentInspection }
  | { readonly ok: false; readonly failure: DeploymentFailure };
