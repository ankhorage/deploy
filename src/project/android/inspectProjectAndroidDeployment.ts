import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { AndroidDeploymentIntent } from '../../domain/AndroidDeploymentIntent';
import type { DeploymentCurrentState } from '../../domain/DeploymentCurrentState';
import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import { generateLocalAndroidFingerprint } from '../../providers/eas/android/generateLocalAndroidFingerprint';
import { inspectEasAndroidConfig } from '../../providers/eas/android/inspectEasAndroidConfig';
import { createAndroidDeploymentRevision } from '../../targets/android/createAndroidDeploymentRevision';
import { isAndroidDeploymentIntentValid } from '../../targets/android/isAndroidDeploymentIntentValid';
import { resolveDeployProject } from '../resolveDeployProject';
import { inspectProjectAndroidEasSetup } from './inspectProjectAndroidEasSetup';
import { inspectProjectAndroidGooglePlay } from './inspectProjectAndroidGooglePlay';
import { normalizeProjectAndroidDesired } from './normalizeProjectAndroidDesired';
import type { ProjectAndroidDeploymentAccess } from './ProjectAndroidDeploymentAccess';
import type { ProjectAndroidDeploymentInspectionResult } from './ProjectAndroidDeploymentInspection';
import type { ProjectAndroidDeploymentRuntime } from './ProjectAndroidDeploymentRuntime';
import { projectAndroidDeploymentRuntime } from './ProjectAndroidDeploymentRuntime';
import { readCurrentProjectAndroidDeployment } from './readCurrentProjectAndroidDeployment';
import { resolveProjectAndroidDeploymentAccess } from './resolveProjectAndroidDeploymentAccess';

export interface InspectProjectAndroidDeploymentOptions extends ProjectAndroidDeploymentAccess {
  readonly projectRoot: string;
  readonly intent: AndroidDeploymentIntent;
}

export function inspectProjectAndroidDeployment(
  options: InspectProjectAndroidDeploymentOptions,
): Promise<ProjectAndroidDeploymentInspectionResult> {
  return inspectProjectAndroidDeploymentWithRuntime(options, projectAndroidDeploymentRuntime);
}

export async function inspectProjectAndroidDeploymentWithRuntime(
  options: InspectProjectAndroidDeploymentOptions,
  runtime: ProjectAndroidDeploymentRuntime,
): Promise<ProjectAndroidDeploymentInspectionResult> {
  try {
    if (!isAndroidDeploymentIntentValid(options.intent)) return invalidIntent();
    const project = await resolveDeployProject({ projectRoot: options.projectRoot });
    const normalized = normalizeProjectAndroidDesired(project.deploy);
    if (!normalized.ok) return normalized;
    if (!normalized.enabled || normalized.packageName === undefined) {
      const current = await readCurrentProjectAndroidDeployment({ projectRoot: project.projectRoot });
      return success(project.projectRoot, normalized.desired, current, options.intent, undefined, []);
    }
    return inspectEnabledProject(project.projectRoot, normalized.desired, normalized.packageName, options, runtime);
  } catch {
    return failure('ANDROID_PROJECT_INSPECTION_FAILED', 'Android deployment project inspection failed.');
  }
}

async function inspectEnabledProject(
  projectRoot: string,
  desired: AppDeployManifest,
  packageName: string,
  options: InspectProjectAndroidDeploymentOptions,
  runtime: ProjectAndroidDeploymentRuntime,
): Promise<ProjectAndroidDeploymentInspectionResult> {
  const access = resolveProjectAndroidDeploymentAccess(options);
  const config = await inspectEasAndroidConfig({
    projectRoot,
    packageName,
    buildProfile: options.intent.buildProfile,
    ...access,
    runProcess: runtime.runProcess,
  });
  const [easSetup, google] = await Promise.all([
    inspectProjectAndroidEasSetup(projectRoot, access, runtime),
    inspectProjectAndroidGooglePlay({ packageName, track: options.intent.track, access, runtime }),
  ]);
  const current = await readCurrentProjectAndroidDeployment({
    projectRoot,
    packageName,
    trackState: google.trackState,
  });
  if (config.status === 'failed') return { ok: false, failure: config.failure };
  if (config.status === 'action-required') {
    return success(projectRoot, desired, current, options.intent, undefined, [easSetup, google.setup]);
  }
  const fingerprint = await generateLocalAndroidFingerprint({
    projectRoot,
    profileEnvironment: config.config.profileEnvironment,
    runProcess: runtime.runProcess,
  });
  if (fingerprint.status === 'failed') return { ok: false, failure: fingerprint.failure };
  const revision = createAndroidDeploymentRevision(fingerprint.fingerprint, options.intent);
  return success(projectRoot, desired, current, options.intent, revision, [easSetup, google.setup]);
}

function success(
  projectRoot: string,
  desired: AppDeployManifest,
  current: DeploymentCurrentState,
  intent: AndroidDeploymentIntent,
  desiredRevision: string | undefined,
  setups: readonly DeploymentProviderSetupInspectionResult[],
): ProjectAndroidDeploymentInspectionResult {
  return {
    ok: true,
    inspection: {
      projectRoot,
      desired,
      current,
      intent,
      ...(desiredRevision === undefined ? {} : { desiredRevision }),
      setups,
    },
  };
}

function invalidIntent(): ProjectAndroidDeploymentInspectionResult {
  return failure('INVALID_ANDROID_DEPLOYMENT_INTENT', 'Android deployment intent is invalid.');
}

function failure(code: string, message: string): ProjectAndroidDeploymentInspectionResult {
  return { ok: false, failure: { code, message, target: 'android' } };
}
