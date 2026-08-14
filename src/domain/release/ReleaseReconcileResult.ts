import type { ReleasePlan } from './ReleasePlan';

export interface ReleaseReconcileResult {
  readonly status: 'completed' | 'waiting' | 'blocked' | 'failed' | 'drifted';
  readonly plan: ReleasePlan;
  readonly currentRevision: string;
  readonly executedStepIds: readonly string[];
  readonly attemptedStepId?: string;
  readonly code?: string;
}
