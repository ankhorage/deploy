import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import type { ReleasePlan } from '../../domain/release/ReleasePlan';
import type { ReleaseReconcileResult } from '../../domain/release/ReleaseReconcileResult';
import { createProjectReleaseHistoryRecord } from '../releaseHistory/createProjectReleaseHistoryRecord';
import { recordProjectReleaseHistory } from '../releaseHistory/recordProjectReleaseHistory';
import type { ProjectReleaseExecution } from './ProjectReleaseExecution';

export async function recordProjectReleaseExecution(options: {
  readonly projectRoot: string;
  readonly executionId: string;
  readonly recordedAt: string;
  readonly desired: ReleaseDesiredState;
  readonly initialPlan: ReleasePlan;
  readonly result: ReleaseReconcileResult;
}): Promise<ProjectReleaseExecution> {
  try {
    const record = createProjectReleaseHistoryRecord({
      executionId: options.executionId,
      recordedAt: options.recordedAt,
      desired: options.desired,
      initialPlan: options.initialPlan,
      result: options.result,
    });
    await recordProjectReleaseHistory({ projectRoot: options.projectRoot, record });
    return { result: options.result, historyRecorded: true };
  } catch {
    return {
      result: options.result,
      historyRecorded: false,
      historyFailure: historyFailure(),
    };
  }
}

function historyFailure(): DeploymentFailure {
  return {
    code: 'PROJECT_RELEASE_HISTORY_RECORD_FAILED',
    message: 'Project release execution history could not be recorded.',
  };
}
