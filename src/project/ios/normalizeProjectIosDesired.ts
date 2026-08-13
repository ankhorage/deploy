import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import { normalizeIosProviders } from '../../targets/ios/normalizeIosProviders';

export type NormalizeProjectIosDesiredResult =
  | {
      readonly ok: true;
      readonly desired: AppDeployManifest;
      readonly enabled: boolean;
      readonly bundleIdentifier?: string;
    }
  | { readonly ok: false; readonly failure: DeploymentFailure };

export function normalizeProjectIosDesired(
  deploy: AppDeployManifest | null,
): NormalizeProjectIosDesiredResult {
  const ios = deploy?.targets.ios;
  if (ios?.enabled !== true) {
    return { ok: true, desired: { targets: {} }, enabled: false };
  }
  const normalized = normalizeIosProviders(ios.providers);
  if (!normalized.ok) return normalized;
  return {
    ok: true,
    enabled: true,
    bundleIdentifier: ios.bundleIdentifier,
    desired: {
      targets: {
        ios: {
          enabled: true,
          bundleIdentifier: ios.bundleIdentifier,
          providers: normalized.providers,
        },
      },
    },
  };
}
