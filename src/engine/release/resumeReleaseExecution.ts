import { createReleasePlan } from '../../domain/release/createReleasePlan';
import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import type { ReleaseObservedState } from '../../domain/release/ReleaseObservedState';
import type { ReleasePlanStep } from '../../domain/release/ReleasePlanStep';
import type { ReleaseReconcileResult } from '../../domain/release/ReleaseReconcileResult';
import { executeReleasePlan } from './executeReleasePlan';
import type { ReleaseMutationResult } from './ReleaseMutationResult';

type InspectRelease = () => Promise<ReleaseObservedState | null>;
type MutateRelease = (
  step: ReleasePlanStep,
  current: ReleaseObservedState,
) => Promise<ReleaseMutationResult>;

interface PreviousReleaseExecution {
  readonly desired: ReleaseDesiredState;
  readonly result: ReleaseReconcileResult;
}

/*** Resume a release from the exact prior engine state required for safe reconciliation. */
export async function resumeReleaseExecution(options: {
  readonly desired: ReleaseDesiredState;
  readonly previous: PreviousReleaseExecution;
  readonly inspect: InspectRelease;
  readonly mutate: MutateRelease;
}): Promise<ReleaseReconcileResult> {
  const current = await options.inspect();
  if (current === null) return inspectionFailed(options.previous);
  const plan = createReleasePlan(options.desired, current);
  if (options.previous.desired.revision !== options.desired.revision) {
    return blocked(plan, 'RELEASE_RESUME_REVISION_MISMATCH');
  }
  if (hasUnsafeNeverRetry(options.previous, plan.steps)) {
    return blocked(plan, 'RELEASE_STEP_NON_RESUMABLE');
  }
  return executeReleasePlan({
    desired: options.desired,
    plan,
    inspect: options.inspect,
    mutate: options.mutate,
  });
}

/*** Detect an unresolved never-retry step from the previous engine result. */
function hasUnsafeNeverRetry(
  previous: PreviousReleaseExecution,
  currentSteps: readonly ReleasePlanStep[],
): boolean {
  const attempted = previous.result.attemptedStepId;
  if (attempted === undefined) return false;
  const prior = previous.result.plan.steps.find((step) => step.id === attempted);
  if (prior?.retry !== 'never') return false;
  return currentSteps.some((step) => step.id === attempted);
}

/*** Return a stable blocked reconciliation result without mutation. */
function blocked(plan: ReturnType<typeof createReleasePlan>, code: string): ReleaseReconcileResult {
  return {
    status: 'blocked',
    plan,
    currentRevision: plan.currentRevision,
    executedStepIds: [],
    code,
  };
}

/*** Preserve the previous plan when fresh inspection cannot establish current state. */
function inspectionFailed(previous: PreviousReleaseExecution): ReleaseReconcileResult {
  return {
    status: 'failed',
    plan: previous.result.plan,
    currentRevision: previous.result.currentRevision,
    executedStepIds: [],
    code: 'RELEASE_INSPECTION_FAILED',
  };
}
