import type { AppDeployProviderSelection } from '@ankhorage/contracts/deploy';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';

type NormalizedIosProviders = {
  readonly build: 'eas';
  readonly publish: 'app-store-connect';
};

type NormalizeIosProvidersResult =
  | { readonly ok: true; readonly providers: NormalizedIosProviders }
  | { readonly ok: false; readonly failure: DeploymentFailure };

export function normalizeIosProviders(
  providers: AppDeployProviderSelection | undefined,
): NormalizeIosProvidersResult {
  const build = providers?.build ?? 'eas';
  const publish = providers?.publish ?? 'app-store-connect';
  if (build === 'eas' && publish === 'app-store-connect') {
    return { ok: true, providers: { build, publish } };
  }
  return {
    ok: false,
    failure: {
      code: 'UNSUPPORTED_IOS_PROVIDER',
      message: 'The configured iOS deployment provider is not supported.',
      target: 'ios',
    },
  };
}
