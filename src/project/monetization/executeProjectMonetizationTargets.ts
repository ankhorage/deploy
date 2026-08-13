import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import { createMonetizationCurrentRevision } from '../../domain/monetization/createMonetizationCurrentRevision';
import { executeAppStoreMonetizationPlan } from '../../providers/appStoreConnect/executeAppStoreMonetizationPlan';
import { executeGooglePlayMonetizationPlan } from '../../providers/googlePlay/executeGooglePlayMonetizationPlan';
import type { ProjectMonetizationInspection } from './ProjectMonetizationInspection';
import type { ProjectMonetizationPlan } from './ProjectMonetizationPlan';
import type { ProjectMonetizationRuntime } from './ProjectMonetizationRuntime';
import type { ResolvedProjectMonetizationAccess } from './ResolvedProjectMonetizationAccess';

type ProjectMonetizationTargetExecution =
  | { readonly status: 'completed' }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };

export async function executeProjectMonetizationTargets(options: {
  readonly inspection: ProjectMonetizationInspection;
  readonly plan: ProjectMonetizationPlan;
  readonly access: ResolvedProjectMonetizationAccess;
  readonly runtime: ProjectMonetizationRuntime;
}): Promise<ProjectMonetizationTargetExecution> {
  const android = await executeAndroid(options);
  if (android.status !== 'completed') return android;
  return executeIos(options);
}

async function executeAndroid(
  options: Parameters<typeof executeProjectMonetizationTargets>[0],
): Promise<ProjectMonetizationTargetExecution> {
  const packageName = options.inspection.targets.androidPackage;
  if (packageName === undefined || !hasTargetSteps(options.plan, 'android')) {
    return { status: 'completed' };
  }
  const state = options.inspection.states.find((item) => item.target === 'android');
  if (state === undefined) return failed('PROJECT_MONETIZATION_ANDROID_STATE_MISSING');
  const result = await executeGooglePlayMonetizationPlan({
    packageName,
    desired: options.inspection.desired,
    plan: options.plan,
    expectedRevision: createMonetizationCurrentRevision([state]),
    ...options.access,
    createToken: options.runtime.createGooglePlayToken,
    request: options.runtime.requestGooglePlay,
  });
  return normalize(result);
}

async function executeIos(
  options: Parameters<typeof executeProjectMonetizationTargets>[0],
): Promise<ProjectMonetizationTargetExecution> {
  const bundleIdentifier = options.inspection.targets.iosBundleIdentifier;
  if (bundleIdentifier === undefined || !hasTargetSteps(options.plan, 'ios')) {
    return { status: 'completed' };
  }
  const state = options.inspection.states.find((item) => item.target === 'ios');
  if (state === undefined) return failed('PROJECT_MONETIZATION_IOS_STATE_MISSING');
  const result = await executeAppStoreMonetizationPlan({
    bundleIdentifier,
    desired: options.inspection.desired,
    plan: options.plan,
    expectedRevision: createMonetizationCurrentRevision([state]),
    ...options.access,
    createToken: options.runtime.createAppStoreConnectToken,
    request: options.runtime.requestAppStoreConnect,
    now: options.runtime.now(),
  });
  return normalize(result);
}

function hasTargetSteps(plan: ProjectMonetizationPlan, target: 'android' | 'ios'): boolean {
  return plan.steps.some((step) => step.target === target);
}

function normalize(
  result:
    | Awaited<ReturnType<typeof executeGooglePlayMonetizationPlan>>
    | Awaited<ReturnType<typeof executeAppStoreMonetizationPlan>>,
): ProjectMonetizationTargetExecution {
  if (result.status === 'completed') return { status: 'completed' };
  if (result.status === 'action-required') {
    return { status: 'action-required', action: result.action };
  }
  return { status: 'failed', failure: result.failure };
}

function failed(code: string): ProjectMonetizationTargetExecution {
  return {
    status: 'failed',
    failure: { code, message: 'Project monetization target state is missing.' },
  };
}
