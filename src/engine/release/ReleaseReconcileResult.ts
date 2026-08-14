import type { ReleasePlan } from '../../domain/release/ReleasePlan';

export interface ReleaseReconcileResult {
  readonly status: 'completed' | 'waiting' | 'blocked' | 'failed' | 'drifted';
  readonly plan: ReleasePlan;
  readonly currentRevision: string;
  readonly executedStepIds: readonly string[];
  readonly code?: string;
}
