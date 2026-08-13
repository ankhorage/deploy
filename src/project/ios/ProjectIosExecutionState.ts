import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';
import type { IosDeploymentPublication } from '../../domain/IosDeploymentPublication';
import type { AppStoreConnectPublication } from '../../providers/appStoreConnect/AppStoreConnectPublicationResult';
import type { EasIosBuildArtifact } from '../../providers/eas/ios/EasIosBuildArtifact';

export interface ProjectIosExecutionState {
  fingerprint: string | null;
  build: EasIosBuildArtifact | null;
  appStorePublication: AppStoreConnectPublication | null;
  publication: IosDeploymentPublication | null;
  verification: DeploymentVerificationResult | null;
}
