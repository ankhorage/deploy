import type { AndroidDeploymentPublication } from '../../domain/AndroidDeploymentPublication';
import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';
import type { EasAndroidBuildArtifact } from '../../providers/eas/android/EasAndroidBuildArtifact';

export interface ProjectAndroidExecutionState {
  fingerprint: string | null;
  build: EasAndroidBuildArtifact | null;
  publication: AndroidDeploymentPublication | null;
  verification: DeploymentVerificationResult | null;
}
