import type { WebDeploymentPublication } from '@ankhorage/contracts/deploy-provider';

import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';
import type { PreparedWebArtifact } from '../../targets/web/PreparedWebArtifact';

export interface ProjectWebExecutionState {
  artifact: PreparedWebArtifact | null;
  publication: WebDeploymentPublication | null;
  verification: DeploymentVerificationResult | null;
}
