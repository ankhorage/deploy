import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { ProjectReleaseAndroidContext } from './ProjectReleaseAndroidContext';
import type { ProjectReleaseIosContext } from './ProjectReleaseIosContext';
import type { ProjectReleaseWebContext } from './ProjectReleaseWebContext';

export interface ResolvedProjectReleaseAccess {
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly android?: ProjectReleaseAndroidContext;
  readonly ios?: ProjectReleaseIosContext;
  readonly web?: ProjectReleaseWebContext;
}
