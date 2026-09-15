import type { AppDeployProviderSelection } from '@ankhorage/contracts/deploy';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';

interface NormalizedWebProviders {
  readonly build: 'expo';
  readonly publish: string;
}

type NormalizeWebProvidersResult =
  | { readonly ok: true; readonly providers: NormalizedWebProviders }
  | { readonly ok: false; readonly failure: DeploymentFailure };

export function normalizeWebProviders(
  providers: AppDeployProviderSelection | undefined,
): NormalizeWebProvidersResult {
  const build = providers?.build ?? 'expo';
  if (build !== 'expo') {
    return {
      ok: false,
      failure: {
        code: 'UNSUPPORTED_WEB_BUILD_PROVIDER',
        message: 'The configured Web build provider is not supported.',
        target: 'web',
      },
    };
  }
  return {
    ok: true,
    providers: {
      build,
      publish: providers?.publish ?? 'eas',
    },
  };
}
