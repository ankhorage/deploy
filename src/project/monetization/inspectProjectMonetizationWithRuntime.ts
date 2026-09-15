import type { DeploymentMonetizationAdapter } from '@ankhorage/contracts/deploy-provider';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import { createMonetizationCurrentRevision } from '../../domain/monetization/createMonetizationCurrentRevision';
import type { MonetizationTargetState } from '../../domain/monetization/MonetizationTargetState';
import { findDeploymentProvider } from '../../features/provider-registry/utils/findDeploymentProvider.js';
import { resolveDeployProject } from '../resolveDeployProject';
import type { InspectProjectMonetizationOptions } from './InspectProjectMonetizationOptions';
import type { ProjectMonetizationInspection } from './ProjectMonetizationInspection';
import type { ProjectMonetizationInspectionResult } from './ProjectMonetizationInspectionResult';
import type { ProjectMonetizationRuntime } from './ProjectMonetizationRuntime';
import type { ProjectMonetizationTargets } from './ProjectMonetizationTargets';
import { readProjectMonetization } from './readProjectMonetization';
import { resolveProjectMonetizationAccess } from './resolveProjectMonetizationAccess';
import { resolveProjectMonetizationTargets } from './resolveProjectMonetizationTargets';

export async function inspectProjectMonetizationWithRuntime(
  options: InspectProjectMonetizationOptions,
  runtime: ProjectMonetizationRuntime,
): Promise<ProjectMonetizationInspectionResult> {
  try {
    const project = await resolveDeployProject({ projectRoot: options.projectRoot });
    const targets = resolveProjectMonetizationTargets(project.deploy);
    if (!targets.ok) return targets;
    const desired = await readProjectMonetization({ projectRoot: project.projectRoot });
    return inspectTargets(
      project.projectRoot,
      desired,
      targets.targets,
      resolveProjectMonetizationAccess(options),
      runtime,
    );
  } catch {
    return failed('PROJECT_MONETIZATION_INSPECTION_FAILED', 'Monetization inspection failed.');
  }
}

async function inspectTargets(
  projectRoot: string,
  desired: ProjectMonetizationInspection['desired'],
  targets: ProjectMonetizationTargets,
  access: ReturnType<typeof resolveProjectMonetizationAccess>,
  runtime: ProjectMonetizationRuntime,
): Promise<ProjectMonetizationInspectionResult> {
  const states: MonetizationTargetState[] = [];
  const actions: ProjectMonetizationInspection['actions'][number][] = [];
  const androidFailure = await inspectAndroid(targets, access, runtime, states, actions);
  if (androidFailure !== null) return { ok: false, failure: androidFailure };
  const iosFailure = await inspectIos(targets, access, runtime, states, actions);
  if (iosFailure !== null) return { ok: false, failure: iosFailure };
  return {
    ok: true,
    inspection: {
      projectRoot,
      desired,
      targets,
      states,
      currentRevision: createMonetizationCurrentRevision(states),
      actions,
    },
  };
}

async function inspectAndroid(
  targets: ProjectMonetizationTargets,
  access: ReturnType<typeof resolveProjectMonetizationAccess>,
  runtime: ProjectMonetizationRuntime,
  states: MonetizationTargetState[],
  actions: ProjectMonetizationInspection['actions'][number][],
): Promise<DeploymentFailure | null> {
  if (targets.androidPackage === undefined || targets.androidProvider === undefined) return null;
  const adapter = resolveAdapter(runtime, targets.androidProvider, 'android');
  if (adapter === undefined) {
    return providerFailure('android', targets.androidProvider);
  }
  const result = await adapter.inspectAsync({
    identity: { target: 'android', packageName: targets.androidPackage },
    ...access,
  });
  if (result.status === 'completed') states.push(result.value);
  if (result.status === 'action-required') actions.push(result.action);
  return result.status === 'failed' ? result.failure : null;
}

async function inspectIos(
  targets: ProjectMonetizationTargets,
  access: ReturnType<typeof resolveProjectMonetizationAccess>,
  runtime: ProjectMonetizationRuntime,
  states: MonetizationTargetState[],
  actions: ProjectMonetizationInspection['actions'][number][],
): Promise<DeploymentFailure | null> {
  if (targets.iosBundleIdentifier === undefined || targets.iosProvider === undefined) return null;
  const adapter = resolveAdapter(runtime, targets.iosProvider, 'ios');
  if (adapter === undefined) return providerFailure('ios', targets.iosProvider);
  const result = await adapter.inspectAsync({
    identity: { target: 'ios', bundleIdentifier: targets.iosBundleIdentifier },
    ...access,
  });
  if (result.status === 'completed') states.push(result.value);
  if (result.status === 'action-required') actions.push(result.action);
  return result.status === 'failed' ? result.failure : null;
}

function resolveAdapter(
  runtime: ProjectMonetizationRuntime,
  providerId: string,
  target: 'android' | 'ios',
): DeploymentMonetizationAdapter | undefined {
  const registration = findDeploymentProvider(runtime.providers, providerId, 'monetization', target);
  const adapter = registration?.monetization;
  return adapter?.target === target ? adapter : undefined;
}

function providerFailure(target: 'android' | 'ios', provider: string): DeploymentFailure {
  return {
    code: 'PROJECT_MONETIZATION_PROVIDER_UNAVAILABLE',
    message: 'Monetization provider is unavailable.',
    target,
    provider,
  };
}

function failed(code: string, message: string): ProjectMonetizationInspectionResult {
  return { ok: false, failure: { code, message } };
}
