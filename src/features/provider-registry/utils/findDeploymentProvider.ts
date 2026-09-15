import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';
import type {
  DeploymentProviderCapabilityId,
  DeploymentProviderRegistration,
} from '@ankhorage/contracts/deploy-provider';

import type { DeploymentProviderRegistry } from '../../../types/deploymentProviderRegistry.js';

/*** Find a registered provider that declares one capability for one target. */
export function findDeploymentProvider(
  registry: DeploymentProviderRegistry,
  providerId: string,
  capability: DeploymentProviderCapabilityId,
  target: AppDeployTargetId,
): DeploymentProviderRegistration | undefined {
  return registry.find(
    (provider) =>
      provider.descriptor.id === providerId &&
      provider.descriptor.capabilities.some(
        (descriptor) => descriptor.id === capability && descriptor.targets.includes(target),
      ),
  );
}
