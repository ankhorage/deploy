import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';
import type {
  DeploymentCapability,
  DeploymentCredentialReference,
  DeploymentProviderRegistration,
  DeploymentSecretResolver,
} from '@ankhorage/contracts/deploy-provider';

import type { DeploymentProviderSetupInspectionResult } from '../../../../domain/DeploymentProviderSetupInspectionResult.js';
import { inspectDeploymentProviderSetup } from '../../../../engine/inspectDeploymentProviderSetup.js';

/*** Inspect setup through one registered provider without owning provider implementation details. */
export function inspectRegisteredDeploymentProviderSetup(options: {
  readonly registration: DeploymentProviderRegistration;
  readonly projectRoot: string;
  readonly target: AppDeployTargetId;
  readonly capability: DeploymentCapability;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
}): Promise<DeploymentProviderSetupInspectionResult> {
  const setup = options.registration.setup;
  if (setup === undefined) {
    return Promise.resolve({
      ok: true,
      inspection: {
        provider: options.registration.descriptor.id,
        authentication: { status: 'authenticated' },
        capabilities: [{ capability: options.capability, status: 'available' }],
        provisioning: [],
      },
    });
  }
  return inspectDeploymentProviderSetup({
    adapter: setup,
    context: {
      projectRoot: options.projectRoot,
      target: options.target,
      credentials: options.credentials,
      resolveSecret: options.resolveSecret,
    },
  });
}
