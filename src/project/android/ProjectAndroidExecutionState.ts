import type {
  AndroidBuildArtifact,
  AndroidDeploymentPublication,
} from '@ankhorage/contracts/deploy-provider';

import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';

export interface ProjectAndroidExecutionState {
  fingerprint: string | null;
  build: AndroidBuildArtifact | null;
  publication: AndroidDeploymentPublication | null;
  verification: DeploymentVerificationResult | null;
}
