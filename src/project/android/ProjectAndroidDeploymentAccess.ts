import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';

export interface ProjectAndroidDeploymentAccess {
  readonly credentials?: readonly DeploymentCredentialReference[];
  readonly resolveSecret?: DeploymentSecretResolver;
}
