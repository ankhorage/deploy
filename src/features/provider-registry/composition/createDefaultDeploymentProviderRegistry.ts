import { createAppStoreConnectDeploymentProvider } from '@ankhorage/deploy-provider-app-store-connect';
import { createEasDeploymentProvider } from '@ankhorage/deploy-provider-eas';
import { createGooglePlayDeploymentProvider } from '@ankhorage/deploy-provider-google-play';

import type { DeploymentProviderRegistry } from '../../../types/deploymentProviderRegistry.js';

/*** Compose the built-in deployment provider packages at the Deploy boundary. */
export function createDefaultDeploymentProviderRegistry(): DeploymentProviderRegistry {
  return [
    createEasDeploymentProvider(),
    createGooglePlayDeploymentProvider(),
    createAppStoreConnectDeploymentProvider(),
  ];
}
