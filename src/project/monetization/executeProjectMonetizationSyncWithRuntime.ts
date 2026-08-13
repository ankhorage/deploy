import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import { areProjectMonetizationPlansEqual } from './areProjectMonetizationPlansEqual';
import { createProjectMonetizationPlan } from './createProjectMonetizationPlan';
import type { ExecuteProjectMonetizationSyncOptions } from './ExecuteProjectMonetizationSyncOptions';
import { executeProjectMonetizationTargets } from './executeProjectMonetizationTargets';
import { inspectProjectMonetizationWithRuntime } from './inspectProjectMonetizationWithRuntime';
import type { ProjectMonetizationExecutionResult } from './ProjectMonetizationExecutionResult';
import type { ProjectMonetizationRuntime } from './ProjectMonetizationRuntime';
import { resolveProjectMonetizationAccess } from './resolveProjectMonetizationAccess';

export async function executeProjectMonetizationSyncWithRuntime(
  options: ExecuteProjectMonetizationSyncOptions,
  runtime: ProjectMonetizationRuntime,
): Promise<ProjectMonetizationExecutionResult> {
  const expected = createProjectMonetizationPlan(options.inspection);
  if (!areProjectMonetizationPlansEqual(expected, options.plan)) {
    return failed(
      'PROJECT_MONETIZATION_PLAN_MISMATCH',
      'Monetization plan does not match inspection.',
    );
  }
  if (options.plan.actions.length > 0) {
    return { status: 'action-required', actions: options.plan.actions };
  }
  const preflight = await inspectProjectMonetizationWithRuntime(
    { ...options, projectRoot: options.inspection.projectRoot },
    runtime,
  );
  if (!preflight.ok) return { status: 'failed', failure: preflight.failure };
  const freshPlan = createProjectMonetizationPlan(preflight.inspection);
  if (!sameTargets(options.inspection, preflight.inspection)) {
    return failed(
      'PROJECT_MONETIZATION_DRIFT',
      'Monetization target identity changed after planning.',
    );
  }
  if (freshPlan.actions.length > 0) {
    return { status: 'action-required', actions: freshPlan.actions };
  }
  if (!areProjectMonetizationPlansEqual(options.plan, freshPlan)) {
    return failed('PROJECT_MONETIZATION_DRIFT', 'Monetization state changed after planning.');
  }
  if (freshPlan.status === 'no-change') return completed(preflight.inspection, freshPlan);
  const targetResult = await executeProjectMonetizationTargets({
    inspection: preflight.inspection,
    plan: freshPlan,
    access: resolveProjectMonetizationAccess(options),
    runtime,
  });
  if (targetResult.status === 'action-required') {
    return { status: 'action-required', actions: [targetResult.action] };
  }
  if (targetResult.status === 'failed') return { status: 'failed', failure: targetResult.failure };
  return verify(options, runtime);
}

async function verify(
  options: ExecuteProjectMonetizationSyncOptions,
  runtime: ProjectMonetizationRuntime,
): Promise<ProjectMonetizationExecutionResult> {
  const result = await inspectProjectMonetizationWithRuntime(
    { ...options, projectRoot: options.inspection.projectRoot },
    runtime,
  );
  if (!result.ok) return { status: 'failed', failure: result.failure };
  const plan = createProjectMonetizationPlan(result.inspection);
  if (plan.actions.length > 0) return { status: 'action-required', actions: plan.actions };
  return plan.status === 'no-change'
    ? completed(result.inspection, plan)
    : failed(
        'PROJECT_MONETIZATION_VERIFICATION_FAILED',
        'Monetization read-back verification failed.',
      );
}

function sameTargets(
  left: ExecuteProjectMonetizationSyncOptions['inspection'],
  right: ExecuteProjectMonetizationSyncOptions['inspection'],
): boolean {
  return JSON.stringify(left.targets) === JSON.stringify(right.targets);
}

function completed(
  inspection: Parameters<typeof createProjectMonetizationPlan>[0],
  plan: ReturnType<typeof createProjectMonetizationPlan>,
): ProjectMonetizationExecutionResult {
  return { status: 'completed', inspection, plan };
}

function failed(code: string, message: string): ProjectMonetizationExecutionResult {
  const failure: DeploymentFailure = { code, message };
  return { status: 'failed', failure };
}
