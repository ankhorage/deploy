import type { ReleaseExecutionState } from './ReleaseExecutionState';
import type { ReleaseExecutionStep } from './ReleaseExecutionStep';
import type { ReleasePlan } from './ReleasePlan';
import type { ReleaseReconcileResult } from './ReleaseReconcileResult';

export function createReleaseExecutionStateFromResult(options: {
  readonly releaseRevision: string;
  readonly initialPlan: ReleasePlan;
  readonly result: ReleaseReconcileResult;
}): ReleaseExecutionState {
  return {
    releaseRevision: options.releaseRevision,
    steps: options.initialPlan.steps.map((step) => createStep(step, options.result)),
  };
}

function createStep(
  step: ReleasePlan['steps'][number],
  result: ReleaseReconcileResult,
): ReleaseExecutionStep {
  if (result.executedStepIds.includes(step.id)) {
    return { step, status: 'completed', attempts: 1 };
  }
  if (result.attemptedStepId === step.id && result.status === 'failed') {
    return {
      step,
      status: 'failed',
      attempts: 1,
      ...(result.code === undefined ? {} : { code: result.code }),
    };
  }
  return { step, status: 'pending', attempts: 0 };
}
