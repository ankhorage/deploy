import type { AppDeployProviderSelection } from '@ankhorage/contracts/deploy';

interface NormalizedIosProviders {
  readonly build: string;
  readonly publish: string;
}

interface NormalizeIosProvidersResult {
  readonly ok: true;
  readonly providers: NormalizedIosProviders;
}

export function normalizeIosProviders(
  providers: AppDeployProviderSelection | undefined,
): NormalizeIosProvidersResult {
  return {
    ok: true,
    providers: {
      build: providers?.build ?? 'eas',
      publish: providers?.publish ?? 'app-store-connect',
    },
  };
}
