import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { ProjectIosDeploymentAccess } from './ProjectIosDeploymentAccess';

export interface ResolvedProjectIosDeploymentAccess {
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
}

export function resolveProjectIosDeploymentAccess(
  access: ProjectIosDeploymentAccess,
): ResolvedProjectIosDeploymentAccess {
  return {
    credentials: access.credentials ?? [],
    resolveSecret: access.resolveSecret ?? (() => Promise.resolve(null)),
  };
}
