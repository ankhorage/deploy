import type { DeploymentProviderSetupAdapter } from '../../domain/DeploymentProviderSetupAdapter';
import type { DeploymentProviderSetupInspection } from '../../domain/DeploymentProviderSetupInspection';
import type { AppStoreConnectTokenFactory } from './AppStoreConnectTokenFactory';
import { resolveAppStoreConnectToken } from './resolveAppStoreConnectToken';

export function createAppStoreConnectSetupAdapter(options: {
  readonly createToken: AppStoreConnectTokenFactory;
  readonly now: () => Date;
}): DeploymentProviderSetupAdapter {
  return {
    provider: 'app-store-connect',
    inspectSetup: async (context) => {
      const access = await resolveAppStoreConnectToken({
        ...context,
        createToken: options.createToken,
        now: options.now(),
      });
      return access.ok ? ready() : required(access.action);
    },
  };
}

function ready(): DeploymentProviderSetupInspection {
  return {
    provider: 'app-store-connect',
    authentication: { status: 'authenticated' },
    capabilities: [{ capability: 'publish', status: 'available' }],
    provisioning: [],
  };
}

function required(
  action: Extract<
    Awaited<ReturnType<typeof resolveAppStoreConnectToken>>,
    { readonly ok: false }
  >['action'],
): DeploymentProviderSetupInspection {
  return {
    provider: 'app-store-connect',
    authentication: { status: 'required', action },
    capabilities: [
      { capability: 'publish', status: 'unavailable', reason: 'Authentication required.' },
    ],
    provisioning: [{ type: 'authentication', action }],
  };
}
