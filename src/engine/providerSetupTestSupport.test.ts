import type { DeploymentCredentialReference } from '../domain/DeploymentCredentialReference';
import type { DeploymentProviderSetupAdapter } from '../domain/DeploymentProviderSetupAdapter';
import type { DeploymentProviderSetupContext } from '../domain/DeploymentProviderSetupContext';
import type { DeploymentProviderSetupInspection } from '../domain/DeploymentProviderSetupInspection';

export const FIXTURE_PROVIDER = 'fixture-provider';
export const FIXTURE_SECRET = 'SUPER_SECRET_SENTINEL';

export const FIXTURE_CREDENTIAL: DeploymentCredentialReference = {
  provider: FIXTURE_PROVIDER,
  id: 'primary',
  kind: 'token',
};

export function createSetupContext(secret = FIXTURE_SECRET): DeploymentProviderSetupContext {
  return {
    credentials: [FIXTURE_CREDENTIAL],
    resolveSecret: () => Promise.resolve(secret),
  };
}

export function createSetupAdapter(
  inspectSetup: (
    context: DeploymentProviderSetupContext,
  ) => Promise<DeploymentProviderSetupInspection>,
): DeploymentProviderSetupAdapter {
  return { provider: FIXTURE_PROVIDER, inspectSetup };
}
