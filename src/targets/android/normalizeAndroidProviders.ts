import type { AppDeployProviderSelection } from '@ankhorage/contracts/deploy';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';

type NormalizedAndroidProviders = {
  readonly build: 'eas';
  readonly publish: 'google-play';
};

type NormalizeAndroidProvidersResult =
  | { readonly ok: true; readonly providers: NormalizedAndroidProviders }
  | { readonly ok: false; readonly failure: DeploymentFailure };

export function normalizeAndroidProviders(
  providers: AppDeployProviderSelection | undefined,
): NormalizeAndroidProvidersResult {
  const build = providers?.build ?? 'eas';
  const publish = providers?.publish ?? 'google-play';
  if (build === 'eas' && publish === 'google-play') {
    return { ok: true, providers: { build, publish } };
  }
  return {
    ok: false,
    failure: {
      code: 'UNSUPPORTED_ANDROID_PROVIDER',
      message: 'The configured Android deployment provider is not supported.',
      target: 'android',
    },
  };
}
