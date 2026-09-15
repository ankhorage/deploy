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
  const androidProvider = android.desired.targets.android?.providers?.publish;
  if (android.enabled && androidProvider === undefined) {
    return failure('MONETIZATION_ANDROID_PROVIDER_REQUIRED', 'Android provider is required.');
  }
  const iosProvider = ios.desired.targets.ios?.providers?.publish;
  if (ios.enabled && iosProvider === undefined) {
    return failure('MONETIZATION_IOS_PROVIDER_REQUIRED', 'iOS provider is required.');
  }
  return {
    ok: true,
    targets: {
      ...(android.enabled
        ? { androidPackage: android.packageName, androidProvider }
        : {}),
      ...(ios.enabled
        ? { iosBundleIdentifier: ios.bundleIdentifier, iosProvider }
        : {}),
    },
  };
}

function failure(code: string, message: string): ProjectMonetizationTargetsResult {
  return { ok: false, failure: { code, message } };
}
