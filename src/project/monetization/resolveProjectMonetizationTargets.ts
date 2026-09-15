import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import { normalizeProjectAndroidDesired } from '../android/normalizeProjectAndroidDesired';
import { normalizeProjectIosDesired } from '../ios/normalizeProjectIosDesired';
import type { ProjectMonetizationTargets } from './ProjectMonetizationTargets';

type ProjectMonetizationTargetsResult =
  | { readonly ok: true; readonly targets: ProjectMonetizationTargets }
  | { readonly ok: false; readonly failure: DeploymentFailure };

type ProjectMonetizationTargetPart =
  | { readonly ok: true; readonly value: Partial<ProjectMonetizationTargets> }
  | { readonly ok: false; readonly failure: DeploymentFailure };

export function resolveProjectMonetizationTargets(
  deploy: AppDeployManifest | null,
): ProjectMonetizationTargetsResult {
  const android = normalizeProjectAndroidDesired(deploy);
  if (!android.ok) return android;
  const ios = normalizeProjectIosDesired(deploy);
  if (!ios.ok) return ios;
  const androidTarget = resolveAndroidTarget(android);
  if (!androidTarget.ok) return androidTarget;
  const iosTarget = resolveIosTarget(ios);
  if (!iosTarget.ok) return iosTarget;
  return {
    ok: true,
    targets: {
      ...androidTarget.value,
      ...iosTarget.value,
    },
  };
}

function resolveAndroidTarget(
  android: Extract<ReturnType<typeof normalizeProjectAndroidDesired>, { readonly ok: true }>,
): ProjectMonetizationTargetPart {
  if (!android.enabled) return success({});
  if (android.packageName === undefined) {
    return failure('MONETIZATION_ANDROID_PACKAGE_REQUIRED', 'Android package is required.');
  }
  const provider = android.desired.targets.android?.providers?.publish;
  if (provider === undefined) {
    return failure('MONETIZATION_ANDROID_PROVIDER_REQUIRED', 'Android provider is required.');
  }
  return success({ androidPackage: android.packageName, androidProvider: provider });
}

function resolveIosTarget(
  ios: Extract<ReturnType<typeof normalizeProjectIosDesired>, { readonly ok: true }>,
): ProjectMonetizationTargetPart {
  if (!ios.enabled) return success({});
  if (ios.bundleIdentifier === undefined) {
    return failure('MONETIZATION_IOS_BUNDLE_REQUIRED', 'iOS bundle identifier is required.');
  }
  const provider = ios.desired.targets.ios?.providers?.publish;
  if (provider === undefined) {
    return failure('MONETIZATION_IOS_PROVIDER_REQUIRED', 'iOS provider is required.');
  }
  return success({ iosBundleIdentifier: ios.bundleIdentifier, iosProvider: provider });
}

function success(value: Partial<ProjectMonetizationTargets>): ProjectMonetizationTargetPart {
  return { ok: true, value };
}

function failure(code: string, message: string): ProjectMonetizationTargetPart {
  return { ok: false, failure: { code, message } };
}
