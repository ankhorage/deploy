import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

import type { DeploymentCredentialReference } from './DeploymentCredentialReference';
import type { DeploymentSecretResolver } from './DeploymentSecretResolver';

export interface DeploymentProviderSetupContext {
  readonly projectRoot: string;
  readonly target?: AppDeployTargetId;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
}
