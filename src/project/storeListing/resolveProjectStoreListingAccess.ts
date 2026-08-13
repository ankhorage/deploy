import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { ProjectStoreListingAccess } from './ProjectStoreListingAccess';

export interface ResolvedProjectStoreListingAccess {
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
}

export function resolveProjectStoreListingAccess(
  access: ProjectStoreListingAccess,
): ResolvedProjectStoreListingAccess {
  return {
    credentials: access.credentials ?? [],
    resolveSecret: access.resolveSecret ?? (() => Promise.resolve(null)),
  };
}
