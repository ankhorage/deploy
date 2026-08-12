import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { ProjectWebDeploymentAccess } from './ProjectWebDeploymentAccess';

export interface ResolvedProjectWebDeploymentAccess {
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
}

export function resolveProjectWebDeploymentAccess(
  access: ProjectWebDeploymentAccess,
): ResolvedProjectWebDeploymentAccess {
  return {
    credentials: access.credentials ?? [],
    resolveSecret: access.resolveSecret ?? (() => Promise.resolve(null)),
  };
}
