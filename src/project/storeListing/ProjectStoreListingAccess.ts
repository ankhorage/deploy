import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';

export interface ProjectStoreListingAccess {
  readonly credentials?: readonly DeploymentCredentialReference[];
  readonly resolveSecret?: DeploymentSecretResolver;
}
