import type { DeploymentMonetizationAdapter } from '@ankhorage/contracts/deploy-provider';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import { findDeploymentProvider } from '../../features/provider-registry/utils/findDeploymentProvider.js';
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
  const { androidPackage, androidProvider } = options.inspection.targets;
  if (
    androidPackage === undefined ||
    androidProvider === undefined ||
    !hasTargetSteps(options.plan, 'android')
  ) {
    return { status: 'completed' };
  }
  const adapter = resolveAdapter(options.runtime, androidProvider, 'android');
  if (adapter === undefined) return providerFailed('android', androidProvider);
  const result = await adapter.syncAsync({
    identity: { target: 'android', packageName: androidPackage },
    desired: options.inspection.desired,
    plan: options.plan,
    ...options.access,
  });
  return normalize(result);
}

async function executeIos(
  options: Parameters<typeof executeProjectMonetizationTargets>[0],
): Promise<ProjectMonetizationTargetExecution> {
  const { iosBundleIdentifier, iosProvider } = options.inspection.targets;
  if (
    iosBundleIdentifier === undefined ||
    iosProvider === undefined ||
    !hasTargetSteps(options.plan, 'ios')
  ) {
    return { status: 'completed' };
  }
  const adapter = resolveAdapter(options.runtime, iosProvider, 'ios');
  if (adapter === undefined) return providerFailed('ios', iosProvider);
  const result = await adapter.syncAsync({
    identity: { target: 'ios', bundleIdentifier: iosBundleIdentifier },
    desired: options.inspection.desired,
    plan: options.plan,
    ...options.access,
  });
  return normalize(result);
}

function resolveAdapter(
  runtime: ProjectMonetizationRuntime,
  providerId: string,
  target: 'android' | 'ios',
): DeploymentMonetizationAdapter | undefined {
  const registration = findDeploymentProvider(
    runtime.providers,
    providerId,
    'monetization',
    target,
  );
  const adapter = registration?.monetization;
  return adapter?.target === target ? adapter : undefined;
}

function hasTargetSteps(plan: ProjectMonetizationPlan, target: 'android' | 'ios'): boolean {
  return plan.steps.some((step) => step.target === target);
}

function normalize(
  result: Awaited<ReturnType<DeploymentMonetizationAdapter['syncAsync']>>,
): ProjectMonetizationTargetExecution {
  if (result.status === 'completed') return { status: 'completed' };
  if (result.status === 'action-required') {
    return { status: 'action-required', action: result.action };
  }
  return { status: 'failed', failure: result.failure };
}

function providerFailed(
  target: 'android' | 'ios',
  provider: string,
): ProjectMonetizationTargetExecution {
  return {
    status: 'failed',
    failure: {
      code: 'PROJECT_MONETIZATION_PROVIDER_UNAVAILABLE',
      message: 'Monetization provider is unavailable.',
      target,
      provider,
    },
  };
}
