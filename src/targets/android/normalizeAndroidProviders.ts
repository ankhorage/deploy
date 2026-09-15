import type { AppDeployProviderSelection } from '@ankhorage/contracts/deploy';

interface NormalizedAndroidProviders {
  readonly build: string;
  readonly publish: string;
}

interface NormalizeAndroidProvidersResult {
  readonly ok: true;
  readonly providers: NormalizedAndroidProviders;
}

export function normalizeAndroidProviders(
  providers: AppDeployProviderSelection | undefined,
): NormalizeAndroidProvidersResult {
  return {
    ok: true,
    providers: {
      build: providers?.build ?? 'eas',
      publish: providers?.publish ?? 'google-play',
    },
  };
}
