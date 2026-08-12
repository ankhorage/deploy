import type { DeploymentProviderSetupInspection } from '../domain/DeploymentProviderSetupInspection';
import { FIXTURE_PROVIDER } from './providerSetupTestSupport.test';

export function createSetupInspection(): DeploymentProviderSetupInspection {
  return {
    provider: FIXTURE_PROVIDER,
    authentication: { status: 'authenticated' },
    capabilities: [],
    provisioning: [],
  };
}
