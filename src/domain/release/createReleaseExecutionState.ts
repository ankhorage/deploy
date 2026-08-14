import type { ReleaseExecutionState } from './ReleaseExecutionState';
import type { ReleasePlanStep } from './ReleasePlanStep';

export function createReleaseExecutionState(
  releaseRevision: string,
  steps: readonly ReleasePlanStep[],
): ReleaseExecutionState {
  return {
    releaseRevision,
    steps: steps.map((step) => ({ step, status: 'pending', attempts: 0 })),
  };
}
