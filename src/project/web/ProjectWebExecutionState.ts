import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';
import type { WebDeploymentPublication } from '../../domain/WebDeploymentPublication';
import type { PreparedWebArtifact } from '../../targets/web/PreparedWebArtifact';

export interface ProjectWebExecutionState {
  artifact: PreparedWebArtifact | null;
  publication: WebDeploymentPublication | null;
  verification: DeploymentVerificationResult | null;
}
