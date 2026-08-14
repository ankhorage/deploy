import { createReleaseExecutionStateFromResult } from '../../domain/release/createReleaseExecutionStateFromResult';
import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import type { ReleasePlan } from '../../domain/release/ReleasePlan';
import type { ReleaseReconcileResult } from '../../domain/release/ReleaseReconcileResult';
import type { ProjectReleaseHistoryRecord } from './ProjectReleaseHistoryRecord';

export function createProjectReleaseHistoryRecord(options: {
  readonly executionId: string;
  readonly recordedAt: string;
  readonly desired: ReleaseDesiredState;
  readonly initialPlan: ReleasePlan;
  readonly result: ReleaseReconcileResult;
}): ProjectReleaseHistoryRecord {
  if (options.initialPlan.desiredRevision !== options.desired.revision) {
    throw new Error('Release history initial plan revision does not match desired release.');
  }
  return {
    schemaVersion: 1,
    executionId: options.executionId,
    recordedAt: options.recordedAt,
    desired: options.desired,
    initialPlan: options.initialPlan,
    result: options.result,
    execution: createReleaseExecutionStateFromResult({
      releaseRevision: options.desired.revision,
      initialPlan: options.initialPlan,
      result: options.result,
    }),
  };
}
