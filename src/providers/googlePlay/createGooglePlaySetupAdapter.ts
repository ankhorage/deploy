import type { DeploymentProviderSetupAdapter } from '../../domain/DeploymentProviderSetupAdapter';
import type { DeploymentProviderSetupInspection } from '../../domain/DeploymentProviderSetupInspection';
import type { GooglePlayTokenFactory } from './GooglePlayTokenFactory';
import { resolveGooglePlayAccessToken } from './resolveGooglePlayAccessToken';

export function createGooglePlaySetupAdapter(options: {
  readonly createToken: GooglePlayTokenFactory;
}): DeploymentProviderSetupAdapter {
  return {
    provider: 'google-play',
    inspectSetup: async (context) => {
      const access = await resolveGooglePlayAccessToken({
        ...context,
        createToken: options.createToken,
      });
      return access.ok ? ready() : required(access.action);
    },
  };
}

function ready(): DeploymentProviderSetupInspection {
  return {
    provider: 'google-play',
    authentication: { status: 'authenticated' },
    capabilities: [{ capability: 'publish', status: 'available' }],
    provisioning: [],
  };
}

function required(
  action: Extract<
    Awaited<ReturnType<typeof resolveGooglePlayAccessToken>>,
    { readonly ok: false }
  >['action'],
): DeploymentProviderSetupInspection {
  return {
    provider: 'google-play',
    authentication: { status: 'required', action },
    capabilities: [
      { capability: 'publish', status: 'unavailable', reason: 'Authentication required.' },
    ],
    provisioning: [{ type: 'authentication', action }],
  };
}
