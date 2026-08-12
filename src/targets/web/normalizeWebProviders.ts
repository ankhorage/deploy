import type { AppDeployProviderSelection } from '@ankhorage/contracts/deploy';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';

interface NormalizedWebProviders {
  readonly build: 'expo';
  readonly publish: 'eas';
}

type NormalizeWebProvidersResult =
  | { readonly ok: true; readonly providers: NormalizedWebProviders }
  | { readonly ok: false; readonly failure: DeploymentFailure };

export function normalizeWebProviders(
  providers: AppDeployProviderSelection | undefined,
): NormalizeWebProvidersResult {
  const build = providers?.build ?? 'expo';
  const publish = providers?.publish ?? 'eas';
  if (build === 'expo' && publish === 'eas') {
    return { ok: true, providers: { build, publish } };
  }
  return {
    ok: false,
    failure: {
      code: 'UNSUPPORTED_WEB_PROVIDER',
      message: 'The configured Web deployment provider is not supported.',
      target: 'web',
    },
  };
}
