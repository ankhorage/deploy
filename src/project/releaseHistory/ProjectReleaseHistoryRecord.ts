import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import type { ReleaseExecutionState } from '../../domain/release/ReleaseExecutionState';
import type { ReleasePlan } from '../../domain/release/ReleasePlan';
import type { ReleaseReconcileResult } from '../../domain/release/ReleaseReconcileResult';

export interface ProjectReleaseHistoryRecord {
  readonly schemaVersion: 1;
  readonly executionId: string;
  readonly recordedAt: string;
  readonly desired: ReleaseDesiredState;
  readonly initialPlan: ReleasePlan;
  readonly result: ReleaseReconcileResult;
  readonly execution: ReleaseExecutionState;
}
