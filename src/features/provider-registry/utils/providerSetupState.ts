import type {
  DeploymentCapability,
  DeploymentRequiredAction,
} from '@ankhorage/contracts/deploy-provider';

import type { DeploymentProviderSetupInspectionResult } from '../../../domain/DeploymentProviderSetupInspectionResult.js';

/*** Check whether a provider setup exposes one ready deployment capability. */
export function isProviderSetupReady(
  result: DeploymentProviderSetupInspectionResult,
  capability: DeploymentCapability,
): boolean {
  return (
    result.ok &&
    result.inspection.authentication.status === 'authenticated' &&
    result.inspection.provisioning.length === 0 &&
    result.inspection.capabilities.some(
      (state) => state.capability === capability && state.status === 'available',
    )
  );
}

/*** Convert a provider action into the setup shape consumed by Deploy planning. */
export function providerActionSetup(
  provider: string,
  capability: DeploymentCapability,
  action: DeploymentRequiredAction,
): DeploymentProviderSetupInspectionResult {
  const authentication =
    action.type === 'authentication'
      ? { status: 'required' as const, action }
      : { status: 'authenticated' as const };
  const provisioning =
    action.type === 'authentication'
      ? [{ type: 'authentication' as const, action }]
      : [{ type: 'manual-action' as const, action }];
  return {
    ok: true,
    inspection: {
      provider,
      authentication,
      capabilities: [
        { capability, status: 'unavailable', reason: 'Provider setup is incomplete.' },
      ],
      provisioning,
    },
  };
}
