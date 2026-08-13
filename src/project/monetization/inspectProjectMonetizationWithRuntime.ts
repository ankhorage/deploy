import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import { createMonetizationCurrentRevision } from '../../domain/monetization/createMonetizationCurrentRevision';
import type { MonetizationTargetState } from '../../domain/monetization/MonetizationTargetState';
import { inspectAppStoreMonetization } from '../../providers/appStoreConnect/inspectAppStoreMonetization';
import { inspectGooglePlayMonetization } from '../../providers/googlePlay/inspectGooglePlayMonetization';
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
  const androidFailure = await inspectAndroid(desired, targets, access, runtime, states, actions);
  if (androidFailure !== null) return { ok: false, failure: androidFailure };
  const iosFailure = await inspectIos(desired, targets, access, runtime, states, actions);
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
  desired: ProjectMonetizationInspection['desired'],
  targets: ProjectMonetizationTargets,
  access: ReturnType<typeof resolveProjectMonetizationAccess>,
  runtime: ProjectMonetizationRuntime,
  states: MonetizationTargetState[],
  actions: ProjectMonetizationInspection['actions'][number][],
): Promise<DeploymentFailure | null> {
  if (targets.androidPackage === undefined) return null;
  const result = await inspectGooglePlayMonetization({
    packageName: targets.androidPackage,
    desired,
    ...access,
    createToken: runtime.createGooglePlayToken,
    request: runtime.requestGooglePlay,
  });
  if (result.status === 'completed') states.push(result.state);
  if (result.status === 'action-required') actions.push(result.action);
  return result.status === 'failed' ? result.failure : null;
}

async function inspectIos(
  desired: ProjectMonetizationInspection['desired'],
  targets: ProjectMonetizationTargets,
  access: ReturnType<typeof resolveProjectMonetizationAccess>,
  runtime: ProjectMonetizationRuntime,
  states: MonetizationTargetState[],
  actions: ProjectMonetizationInspection['actions'][number][],
): Promise<DeploymentFailure | null> {
  if (targets.iosBundleIdentifier === undefined) return null;
  const result = await inspectAppStoreMonetization({
    bundleIdentifier: targets.iosBundleIdentifier,
    desired,
    ...access,
    createToken: runtime.createAppStoreConnectToken,
    request: runtime.requestAppStoreConnect,
    now: runtime.now(),
  });
  if (result.status === 'completed') states.push(result.state);
  if (result.status === 'action-required') actions.push(result.action);
  return result.status === 'failed' ? result.failure : null;
}

function failed(code: string, message: string): ProjectMonetizationInspectionResult {
  return { ok: false, failure: { code, message } };
}
