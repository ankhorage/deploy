import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';
import type {
  DeploymentCredentialReference,
  DeploymentProviderRegistration,
  DeploymentSecretResolver,
} from '@ankhorage/contracts/deploy-provider';

import type { DeploymentProviderSetupInspectionResult } from '../../../domain/DeploymentProviderSetupInspectionResult.js';
import { inspectDeploymentProviderSetup } from '../../../engine/inspectDeploymentProviderSetup.js';

/*** Inspect setup through one registered provider without owning provider implementation details. */
export function inspectRegisteredDeploymentProviderSetup(options: {
  readonly registration: DeploymentProviderRegistration;
  readonly projectRoot: string;
  readonly target: AppDeployTargetId;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
}): Promise<DeploymentProviderSetupInspectionResult> {
  const setup = options.registration.setup;
  if (setup === undefined) {
    return Promise.resolve({
      ok: false,
      failure: {
        code: 'PROVIDER_SETUP_UNAVAILABLE',
        message: 'The selected deployment provider does not expose setup inspection.',
        target: options.target,
        provider: options.registration.descriptor.id,
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
