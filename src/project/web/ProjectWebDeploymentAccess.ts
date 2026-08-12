import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';

export interface ProjectWebDeploymentAccess {
  readonly credentials?: readonly DeploymentCredentialReference[];
  readonly resolveSecret?: DeploymentSecretResolver;
}
