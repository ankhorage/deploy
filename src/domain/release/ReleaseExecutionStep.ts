import type { ReleasePlanStep } from './ReleasePlanStep';

type ReleaseExecutionStepStatus = 'pending' | 'completed' | 'failed' | 'waiting' | 'cancelled';

export interface ReleaseExecutionStep {
  readonly step: ReleasePlanStep;
  readonly status: ReleaseExecutionStepStatus;
  readonly attempts: number;
  readonly code?: string;
}
