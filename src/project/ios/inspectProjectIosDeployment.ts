import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { DeploymentCurrentState } from '../../domain/DeploymentCurrentState';
import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import type { IosDeploymentIntent } from '../../domain/IosDeploymentIntent';
import { generateLocalIosFingerprint } from '../../providers/eas/ios/generateLocalIosFingerprint';
import { inspectEasIosConfig } from '../../providers/eas/ios/inspectEasIosConfig';
import { createIosDeploymentRevision } from '../../targets/ios/createIosDeploymentRevision';
import { isIosDeploymentIntentValid } from '../../targets/ios/isIosDeploymentIntentValid';
import { resolveDeployProject } from '../resolveDeployProject';
import { inspectProjectIosAppStoreConnect } from './inspectProjectIosAppStoreConnect';
import { inspectProjectIosEasSetup } from './inspectProjectIosEasSetup';
import { normalizeProjectIosDesired } from './normalizeProjectIosDesired';
import type { ProjectIosDeploymentAccess } from './ProjectIosDeploymentAccess';
import type { ProjectIosDeploymentInspectionResult } from './ProjectIosDeploymentInspection';
import type { ProjectIosDeploymentRuntime } from './ProjectIosDeploymentRuntime';
import { projectIosDeploymentRuntime } from './ProjectIosDeploymentRuntime';
import { readCurrentProjectIosDeployment } from './readCurrentProjectIosDeployment';
import { resolveProjectIosDeploymentAccess } from './resolveProjectIosDeploymentAccess';

export interface InspectProjectIosDeploymentOptions extends ProjectIosDeploymentAccess {
  readonly projectRoot: string;
  readonly intent: IosDeploymentIntent;
}

export function inspectProjectIosDeployment(
  options: InspectProjectIosDeploymentOptions,
): Promise<ProjectIosDeploymentInspectionResult> {
  return inspectProjectIosDeploymentWithRuntime(options, projectIosDeploymentRuntime);
}

export async function inspectProjectIosDeploymentWithRuntime(
  options: InspectProjectIosDeploymentOptions,
  runtime: ProjectIosDeploymentRuntime,
): Promise<ProjectIosDeploymentInspectionResult> {
  try {
    if (!isIosDeploymentIntentValid(options.intent)) return invalidIntent();
    const project = await resolveDeployProject({ projectRoot: options.projectRoot });
    const normalized = normalizeProjectIosDesired(project.deploy);
    if (!normalized.ok) return normalized;
    if (!normalized.enabled || normalized.bundleIdentifier === undefined) {
      const current = await readCurrentProjectIosDeployment({ projectRoot: project.projectRoot });
      return success(
        project.projectRoot,
        normalized.desired,
        current,
        options.intent,
        undefined,
        [],
      );
    }
    return inspectEnabledProject(
      project.projectRoot,
      normalized.desired,
      normalized.bundleIdentifier,
      options,
      runtime,
    );
  } catch {
    return failure('IOS_PROJECT_INSPECTION_FAILED', 'iOS deployment project inspection failed.');
  }
}

async function inspectEnabledProject(
  projectRoot: string,
  desired: AppDeployManifest,
  bundleIdentifier: string,
  options: InspectProjectIosDeploymentOptions,
  runtime: ProjectIosDeploymentRuntime,
): Promise<ProjectIosDeploymentInspectionResult> {
  const access = resolveProjectIosDeploymentAccess(options);
  const config = await inspectEasIosConfig({
    projectRoot,
    bundleIdentifier,
    buildProfile: options.intent.buildProfile,
    ...access,
    runProcess: runtime.runProcess,
  });
  const [easSetup, appStore] = await Promise.all([
    inspectProjectIosEasSetup(projectRoot, access, runtime),
    inspectProjectIosAppStoreConnect({
      bundleIdentifier,
      version: options.intent.version,
      access,
      runtime,
    }),
  ]);
  const current = await readCurrentProjectIosDeployment({
    projectRoot,
    bundleIdentifier,
    appStoreState: appStore.state,
  });
  if (config.status === 'failed') return { ok: false, failure: config.failure };
  if (config.status === 'action-required') {
    return success(projectRoot, desired, current, options.intent, undefined, [
      easSetup,
      appStore.setup,
    ]);
  }
  const fingerprint = await generateLocalIosFingerprint({
    projectRoot,
    profileEnvironment: config.config.profileEnvironment,
    runProcess: runtime.runProcess,
  });
  if (fingerprint.status === 'failed') return { ok: false, failure: fingerprint.failure };
  const revision = createIosDeploymentRevision(fingerprint.fingerprint, options.intent);
  return success(projectRoot, desired, current, options.intent, revision, [
    easSetup,
    appStore.setup,
  ]);
}

function success(
  projectRoot: string,
  desired: AppDeployManifest,
  current: DeploymentCurrentState,
  intent: IosDeploymentIntent,
  desiredRevision: string | undefined,
  setups: readonly DeploymentProviderSetupInspectionResult[],
): ProjectIosDeploymentInspectionResult {
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

function invalidIntent(): ProjectIosDeploymentInspectionResult {
  return failure('INVALID_IOS_DEPLOYMENT_INTENT', 'iOS deployment intent is invalid.');
}

function failure(code: string, message: string): ProjectIosDeploymentInspectionResult {
  return { ok: false, failure: { code, message, target: 'ios' } };
}
