import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

import type { DeploymentProviderSetupContext } from '../../domain/DeploymentProviderSetupContext';

export function createProviderSetupContext(
  projectRoot: string,
  credentials: DeploymentProviderSetupContext['credentials'],
  resolveSecret: DeploymentProviderSetupContext['resolveSecret'],
  target: AppDeployTargetId | undefined,
): DeploymentProviderSetupContext {
  return {
    projectRoot,
    credentials,
    resolveSecret,
    ...(target === undefined ? {} : { target }),
  };
}
