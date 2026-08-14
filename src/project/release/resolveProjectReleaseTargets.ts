import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import { normalizeProjectAndroidDesired } from '../android/normalizeProjectAndroidDesired';
import { normalizeProjectIosDesired } from '../ios/normalizeProjectIosDesired';
import { normalizeProjectWebDesired } from '../web/normalizeProjectWebDesired';
import type { ProjectReleaseTargets } from './ProjectReleaseTargets';
import type { ResolvedProjectReleaseAccess } from './ResolvedProjectReleaseAccess';

type ProjectReleaseTargetsResult =
  | { readonly ok: true; readonly targets: ProjectReleaseTargets }
  | { readonly ok: false; readonly failure: DeploymentFailure };

export function resolveProjectReleaseTargets(
  deploy: AppDeployManifest | null,
  desired: ReleaseDesiredState,
  access: ResolvedProjectReleaseAccess,
): ProjectReleaseTargetsResult {
  const web = normalizeProjectWebDesired(deploy);
  if (!web.ok) return web;
  const android = normalizeProjectAndroidDesired(deploy);
  if (!android.ok) return android;
  const ios = normalizeProjectIosDesired(deploy);
  if (!ios.ok) return ios;
  const webTarget = resolveWebTarget(desired, web.enabled, access);
  if (!webTarget.ok) return webTarget;
  const androidTarget = resolveAndroidTarget(desired, android, access);
  if (!androidTarget.ok) return androidTarget;
  const iosTarget = resolveIosTarget(desired, ios, access);
  if (!iosTarget.ok) return iosTarget;
  return {
    ok: true,
    targets: {
      ...webTarget.value,
      ...androidTarget.value,
      ...iosTarget.value,
    },
  };
}

function resolveWebTarget(
  desired: ReleaseDesiredState,
  enabled: boolean,
  access: ResolvedProjectReleaseAccess,
): TargetPart {
  if (!desired.targets.includes('web')) return success({});
  if (!enabled)
    return failure('PROJECT_RELEASE_WEB_TARGET_DISABLED', 'Web release target is disabled.');
  return success({ web: access.web ?? {} });
}

function resolveAndroidTarget(
  desired: ReleaseDesiredState,
  android: ReturnType<typeof normalizeProjectAndroidDesired>,
  access: ResolvedProjectReleaseAccess,
): TargetPart {
  if (!desired.targets.includes('android')) return success({});
  if (!android.ok || !android.enabled || android.packageName === undefined) {
    return failure(
      'PROJECT_RELEASE_ANDROID_TARGET_INVALID',
      'Android release target is unavailable.',
    );
  }
  if (access.android === undefined) {
    return failure('PROJECT_RELEASE_ANDROID_TRACK_REQUIRED', 'Android release track is required.');
  }
  return success({
    android: {
      packageName: android.packageName,
      track: access.android.track,
      ...(access.android.buildProfile === undefined
        ? {}
        : { buildProfile: access.android.buildProfile }),
    },
  });
}

function resolveIosTarget(
  desired: ReleaseDesiredState,
  ios: ReturnType<typeof normalizeProjectIosDesired>,
  access: ResolvedProjectReleaseAccess,
): TargetPart {
  if (!desired.targets.includes('ios')) return success({});
  if (!ios.ok || !ios.enabled || ios.bundleIdentifier === undefined) {
    return failure('PROJECT_RELEASE_IOS_TARGET_INVALID', 'iOS release target is unavailable.');
  }
  return success({
    ios: {
      bundleIdentifier: ios.bundleIdentifier,
      ...(access.ios?.buildProfile === undefined ? {} : { buildProfile: access.ios.buildProfile }),
    },
  });
}

type TargetPart =
  | { readonly ok: true; readonly value: Partial<ProjectReleaseTargets> }
  | { readonly ok: false; readonly failure: DeploymentFailure };

function success(value: Partial<ProjectReleaseTargets>): TargetPart {
  return { ok: true, value };
}

function failure(code: string, message: string): TargetPart {
  return { ok: false, failure: { code, message } };
}
