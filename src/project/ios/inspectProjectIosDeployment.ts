import type { AppDeployManifest } from '@ankhorage/contracts/deploy';
import type { IosPublishInspection } from '@ankhorage/contracts/deploy-provider';

import type { DeploymentCurrentState } from '../../domain/DeploymentCurrentState';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import type { IosDeploymentIntent } from '../../domain/IosDeploymentIntent';
import { inspectRegisteredDeploymentProviderSetup } from '../../features/provider-registry/adapters/inbound/inspectRegisteredDeploymentProviderSetup.js';
import {
  isProviderSetupReady,
  providerActionSetup,
} from '../../features/provider-registry/utils/providerSetupState.js';
import { createIosDeploymentRevision } from '../../targets/ios/createIosDeploymentRevision';
import { isIosDeploymentIntentValid } from '../../targets/ios/isIosDeploymentIntentValid';
import { resolveDeployProject } from '../resolveDeployProject';
import { normalizeProjectIosDesired } from './normalizeProjectIosDesired';
import type { ProjectIosDeploymentAccess } from './ProjectIosDeploymentAccess';
import type { ProjectIosDeploymentInspectionResult } from './ProjectIosDeploymentInspection';
import type { ProjectIosDeploymentRuntime } from './ProjectIosDeploymentRuntime';
import { projectIosDeploymentRuntime } from './ProjectIosDeploymentRuntime';
import { readCurrentProjectIosDeployment } from './readCurrentProjectIosDeployment';
import { resolveIosProviderPorts } from './resolveIosProviderPorts.js';
import type { IosProviderPorts } from './resolveIosProviderPorts.js';
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
  const resolved = resolveIosProviderPorts(desired, runtime);
  if (!resolved.ok) return resolved;
  const access = resolveProjectIosDeploymentAccess(options);
  const [buildSetup, publishSetup] = await Promise.all([
    inspectRegisteredDeploymentProviderSetup({
      registration: resolved.value.buildRegistration,
      projectRoot,
      target: 'ios',
      capability: 'build',
      ...access,
    }),
    inspectRegisteredDeploymentProviderSetup({
      registration: resolved.value.publishRegistration,
      projectRoot,
      target: 'ios',
      capability: 'publish',
      ...access,
    }),
  ]);
  const build = await inspectIosBuild({
    projectRoot,
    bundleIdentifier,
    intent: options.intent,
    access,
    setup: buildSetup,
    ports: resolved.value,
  });
  if (!build.ok) return { ok: false, failure: build.failure };
  const publish = await inspectIosPublish({
    bundleIdentifier,
    intent: options.intent,
    access,
    setup: publishSetup,
    ports: resolved.value,
  });
  const current = await readCurrentProjectIosDeployment({
    projectRoot,
    bundleIdentifier,
    providers: resolved.value.providers,
    publishInspection: publish.inspection,
  });
  const revision =
    build.fingerprint === undefined
      ? undefined
      : createIosDeploymentRevision(build.fingerprint, options.intent);
  return success(projectRoot, desired, current, options.intent, revision, [
    build.setup,
    publish.setup,
  ]);
}

async function inspectIosBuild(options: {
  readonly projectRoot: string;
  readonly bundleIdentifier: string;
  readonly intent: IosDeploymentIntent;
  readonly access: ReturnType<typeof resolveProjectIosDeploymentAccess>;
  readonly setup: DeploymentProviderSetupInspectionResult;
  readonly ports: IosProviderPorts;
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
    bundleIdentifier: options.bundleIdentifier,
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

async function inspectIosPublish(options: {
  readonly bundleIdentifier: string;
  readonly intent: IosDeploymentIntent;
  readonly access: ReturnType<typeof resolveProjectIosDeploymentAccess>;
  readonly setup: DeploymentProviderSetupInspectionResult;
  readonly ports: IosProviderPorts;
}): Promise<{
  readonly setup: DeploymentProviderSetupInspectionResult;
  readonly inspection: IosPublishInspection | null;
}> {
  if (!isProviderSetupReady(options.setup, 'publish')) {
    return { setup: options.setup, inspection: null };
  }
  const result = await options.ports.publisher.inspectAsync({
    bundleIdentifier: options.bundleIdentifier,
    version: options.intent.version,
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
