import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';

export function createProviderSetupFailure(
  code: string,
  message: string,
  provider?: string,
  target?: AppDeployTargetId,
): DeploymentProviderSetupInspectionResult {
  const failure: DeploymentFailure = {
    code,
    message,
    ...(provider === undefined ? {} : { provider }),
    ...(target === undefined ? {} : { target }),
  };
  return { ok: false, failure };
}
