import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { DeploymentCurrentState } from '../../domain/DeploymentCurrentState';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';

export interface ProjectWebDeploymentInspection {
  readonly projectRoot: string;
  readonly desired: AppDeployManifest;
  readonly current: DeploymentCurrentState;
  readonly desiredRevision?: string;
  readonly setup: DeploymentProviderSetupInspectionResult | null;
}

export type ProjectWebDeploymentInspectionResult =
  | { readonly ok: true; readonly inspection: ProjectWebDeploymentInspection }
  | { readonly ok: false; readonly failure: DeploymentFailure };
