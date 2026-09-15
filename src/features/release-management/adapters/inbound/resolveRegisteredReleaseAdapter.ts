import type { DeploymentReleaseAdapter } from '@ankhorage/contracts/deploy-provider';

import type { DeploymentProviderRegistry } from '../../../../types/deploymentProviderRegistry.js';
import { findDeploymentProvider } from '../../../provider-registry/utils/findDeploymentProvider.js';

export function resolveRegisteredReleaseAdapter(options: {
  readonly providers: DeploymentProviderRegistry;
  readonly providerId: string;
  readonly target: 'android' | 'ios';
}): DeploymentReleaseAdapter | undefined {
  const registration = findDeploymentProvider(
    options.providers,
    options.providerId,
    'release',
    options.target,
  );
  const adapter = registration?.release;
  return adapter?.target === options.target ? adapter : undefined;
}
