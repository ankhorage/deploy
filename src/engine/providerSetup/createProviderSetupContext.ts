import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

import type { DeploymentProviderSetupContext } from '../../domain/DeploymentProviderSetupContext';

export function createProviderSetupContext(
  credentials: DeploymentProviderSetupContext['credentials'],
  resolveSecret: DeploymentProviderSetupContext['resolveSecret'],
  target: AppDeployTargetId | undefined,
): DeploymentProviderSetupContext {
  return { credentials, resolveSecret, ...(target === undefined ? {} : { target }) };
}
