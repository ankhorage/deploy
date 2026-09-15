import type { AppDeployManifest, AppDeployProviderSelection } from '@ankhorage/contracts/deploy';
import type {
  DeploymentProviderRegistration,
  WebDeploymentPublisher,
} from '@ankhorage/contracts/deploy-provider';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import { findDeploymentProvider } from '../../features/provider-registry/utils/findDeploymentProvider.js';
import type { ProjectWebDeploymentRuntime } from './ProjectWebDeploymentRuntime';

interface WebProviderPort {
  readonly providers: Required<Pick<AppDeployProviderSelection, 'publish'>>;
  readonly registration: DeploymentProviderRegistration;
  readonly publisher: WebDeploymentPublisher;
}

export type WebProviderPortResult =
  | { readonly ok: true; readonly value: WebProviderPort }
  | { readonly ok: false; readonly failure: DeploymentFailure };

/*** Resolve the Web publish port from the authored provider id. */
export function resolveWebProviderPort(
  desired: AppDeployManifest,
  runtime: ProjectWebDeploymentRuntime,
): WebProviderPortResult {
  const publish = desired.targets.web?.providers?.publish;
  if (publish === undefined) {
    return failure('WEB_PROVIDER_SELECTION_MISSING', 'Web publish provider selection is missing.');
  }
  const registration = findDeploymentProvider(runtime.providers, publish, 'web-publish', 'web');
  if (registration?.webPublisher === undefined) {
    return failure(
      'WEB_PUBLISH_PROVIDER_UNAVAILABLE',
      'The configured Web publish provider is not available.',
      publish,
    );
  }
  return {
    ok: true,
    value: {
      providers: { publish },
      registration,
      publisher: registration.webPublisher,
    },
  };
}

function failure(code: string, message: string, provider?: string): WebProviderPortResult {
  return {
    ok: false,
    failure: {
      code,
      message,
      target: 'web',
      ...(provider === undefined ? {} : { provider }),
    },
  };
}
