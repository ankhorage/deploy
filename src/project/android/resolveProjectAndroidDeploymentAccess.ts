import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { ProjectAndroidDeploymentAccess } from './ProjectAndroidDeploymentAccess';

export interface ResolvedProjectAndroidDeploymentAccess {
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
}

export function resolveProjectAndroidDeploymentAccess(
  access: ProjectAndroidDeploymentAccess,
): ResolvedProjectAndroidDeploymentAccess {
  return {
    credentials: access.credentials ?? [],
    resolveSecret: access.resolveSecret ?? (() => Promise.resolve(null)),
  };
}
