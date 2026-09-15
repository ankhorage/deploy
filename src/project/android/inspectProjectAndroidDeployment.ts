import type { AppDeployManifest } from '@ankhorage/contracts/deploy';
import type { AndroidPublishInspection } from '@ankhorage/contracts/deploy-provider';

import type { AndroidDeploymentIntent } from '../../domain/AndroidDeploymentIntent';
import type { DeploymentCurrentState } from '../../domain/DeploymentCurrentState';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import { inspectRegisteredDeploymentProviderSetup } from '../../features/provider-registry/adapters/inbound/inspectRegisteredDeploymentProviderSetup.js';
import {
  isProviderSetupReady,
  providerActionSetup,
} from '../../features/provider-registry/utils/providerSetupState.js';
import { createAndroidDeploymentRevision } from '../../targets/android/createAndroidDeploymentRevision';
import { isAndroidDeploymentIntentValid } from '../../targets/android/isAndroidDeploymentIntentValid';
import { resolveDeployProject } from '../resolveDeployProject';
import { normalizeProjectAndroidDesired } from './normalizeProjectAndroidDesired';
import type { ProjectAndroidDeploymentAccess } from './ProjectAndroidDeploymentAccess';
import type { ProjectAndroidDeploymentInspectionResult } from './ProjectAndroidDeploymentInspection';
import type { ProjectAndroidDeploymentRuntime } from './ProjectAndroidDeploymentRuntime';
import { projectAndroidDeploymentRuntime } from './ProjectAndroidDeploymentRuntime';
import { readCurrentProjectAndroidDeployment } from './readCurrentProjectAndroidDeployment';
import { resolveAndroidProviderPorts } from './resolveAndroidProviderPorts.js';
import type { AndroidProviderPorts } from './resolveAndroidProviderPorts.js';
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
    return inspectEnabledProject(
      project.projectRoot,
      normalized.desired,
      normalized.packageName,
      options,
      runtime,
    );
  } catch {
    return failure(
      'ANDROID_PROJECT_INSPECTION_FAILED',
      'Android deployment project inspection failed.',
    );
  }
}

async function inspectEnabledProject(
  projectRoot: string,
  desired: AppDeployManifest,
  packageName: string,
  options: InspectProjectAndroidDeploymentOptions,
  runtime: ProjectAndroidDeploymentRuntime,
): Promise<ProjectAndroidDeploymentInspectionResult> {
  const resolved = resolveAndroidProviderPorts(desired, runtime);
  if (!resolved.ok) return resolved;
  const access = resolveProjectAndroidDeploymentAccess(options);
  const [buildSetup, publishSetup] = await Promise.all([
    inspectRegisteredDeploymentProviderSetup({
      registration: resolved.value.buildRegistration,
      projectRoot,
      target: 'android',
      capability: 'build',
      ...access,
    }),
    inspectRegisteredDeploymentProviderSetup({
      registration: resolved.value.publishRegistration,
      projectRoot,
      target: 'android',
      capability: 'publish',
      ...access,
    }),
  ]);
  const build = await inspectAndroidBuild({
    projectRoot,
    packageName,
    intent: options.intent,
    access,
    setup: buildSetup,
    ports: resolved.value,
  });
  if (!build.ok) return { ok: false, failure: build.failure };
  const publish = await inspectAndroidPublish({
    packageName,
    intent: options.intent,
    access,
    setup: publishSetup,
    ports: resolved.value,
  });
  const current = await readCurrentProjectAndroidDeployment({
    projectRoot,
    packageName,
    providers: resolved.value.providers,
    publishInspection: publish.inspection,
  });
  const revision =
    build.fingerprint === undefined
      ? undefined
      : createAndroidDeploymentRevision(build.fingerprint, options.intent);
  return success(projectRoot, desired, current, options.intent, revision, [build.setup, publish.setup]);
}

async function inspectAndroidBuild(options: {
  readonly projectRoot: string;
  readonly packageName: string;
  readonly intent: AndroidDeploymentIntent;
  readonly access: ReturnType<typeof resolveProjectAndroidDeploymentAccess>;
  readonly setup: DeploymentProviderSetupInspectionResult;
  readonly ports: AndroidProviderPorts;
}): Promise<
  | {
      readonly ok: true;
      readonly setup: DeploymentProviderSetupInspectionResult;
      readonly fingerprint?: string;
    }
  | { readonly ok: false; readonly failure: DeploymentFailure }
> {
  if (!isProviderSetupReady(options.setup, 'build')) return { ok: true, setup: options.setup };
  const result = await options.ports.builder.inspectAsync({
    projectRoot: options.projectRoot,
    packageName: options.packageName,
    buildProfile: options.intent.buildProfile,
    ...options.access,
  });
  if (result.status === 'failed') return { ok: false, failure: result.failure };
  if (result.status === 'action-required') {
    return {
      ok: true,
      setup: providerActionSetup(
        options.ports.buildRegistration.descriptor.id,
        'build',
        result.action,
      ),
    };
  }
  return { ok: true, setup: options.setup, fingerprint: result.value.fingerprint };
}

async function inspectAndroidPublish(options: {
  readonly packageName: string;
  readonly intent: AndroidDeploymentIntent;
  readonly access: ReturnType<typeof resolveProjectAndroidDeploymentAccess>;
  readonly setup: DeploymentProviderSetupInspectionResult;
  readonly ports: AndroidProviderPorts;
}): Promise<{
  readonly setup: DeploymentProviderSetupInspectionResult;
  readonly inspection: AndroidPublishInspection | null;
}> {
  if (!isProviderSetupReady(options.setup, 'publish')) {
    return { setup: options.setup, inspection: null };
  }
  const result = await options.ports.publisher.inspectAsync({
    packageName: options.packageName,
    track: options.intent.track,
    ...options.access,
  });
  if (result.status === 'completed') return { setup: options.setup, inspection: result.value };
  if (result.status === 'failed') {
    return { setup: { ok: false, failure: result.failure }, inspection: null };
  }
  return {
    setup: providerActionSetup(
      options.ports.publishRegistration.descriptor.id,
      'publish',
      result.action,
    ),
    inspection: null,
  };
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
