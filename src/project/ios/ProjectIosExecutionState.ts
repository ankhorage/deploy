import type {
  IosBuildArtifact,
  IosDeploymentPublication,
} from '@ankhorage/contracts/deploy-provider';

import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';

export interface ProjectIosExecutionState {
  fingerprint: string | null;
  build: IosBuildArtifact | null;
  publication: IosDeploymentPublication | null;
  verification: DeploymentVerificationResult | null;
}
