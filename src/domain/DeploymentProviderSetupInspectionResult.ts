import type { DeploymentFailure } from './DeploymentFailure';
import type { DeploymentProviderSetupInspection } from './DeploymentProviderSetupInspection';

export type DeploymentProviderSetupInspectionResult =
  | { readonly ok: true; readonly inspection: DeploymentProviderSetupInspection }
  | { readonly ok: false; readonly failure: DeploymentFailure };
