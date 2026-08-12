import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import { normalizeAndroidProviders } from '../../targets/android/normalizeAndroidProviders';

export type NormalizeProjectAndroidDesiredResult =
  | {
      readonly ok: true;
      readonly desired: AppDeployManifest;
      readonly enabled: boolean;
      readonly packageName?: string;
    }
  | { readonly ok: false; readonly failure: DeploymentFailure };

export function normalizeProjectAndroidDesired(
  deploy: AppDeployManifest | null,
): NormalizeProjectAndroidDesiredResult {
  const android = deploy?.targets.android;
  if (android?.enabled !== true) {
    return { ok: true, desired: { targets: {} }, enabled: false };
  }
  const normalized = normalizeAndroidProviders(android.providers);
  if (!normalized.ok) return normalized;
  return {
    ok: true,
    enabled: true,
    packageName: android.package,
    desired: {
      targets: {
        android: {
          enabled: true,
          package: android.package,
          providers: normalized.providers,
        },
      },
    },
  };
}
