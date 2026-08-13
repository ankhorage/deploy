import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import { normalizeProjectAndroidDesired } from '../android/normalizeProjectAndroidDesired';
import { normalizeProjectIosDesired } from '../ios/normalizeProjectIosDesired';
import type { ProjectMonetizationTargets } from './ProjectMonetizationTargets';

type ProjectMonetizationTargetsResult =
  | { readonly ok: true; readonly targets: ProjectMonetizationTargets }
  | { readonly ok: false; readonly failure: DeploymentFailure };

export function resolveProjectMonetizationTargets(
  deploy: AppDeployManifest | null,
): ProjectMonetizationTargetsResult {
  const android = normalizeProjectAndroidDesired(deploy);
  if (!android.ok) return android;
  const ios = normalizeProjectIosDesired(deploy);
  if (!ios.ok) return ios;
  if (android.enabled && android.packageName === undefined) {
    return failure('MONETIZATION_ANDROID_PACKAGE_REQUIRED', 'Android package is required.');
  }
  if (ios.enabled && ios.bundleIdentifier === undefined) {
    return failure('MONETIZATION_IOS_BUNDLE_REQUIRED', 'iOS bundle identifier is required.');
  }
  return {
    ok: true,
    targets: {
      ...(android.enabled ? { androidPackage: android.packageName } : {}),
      ...(ios.enabled ? { iosBundleIdentifier: ios.bundleIdentifier } : {}),
    },
  };
}

function failure(code: string, message: string): ProjectMonetizationTargetsResult {
  return { ok: false, failure: { code, message } };
}
