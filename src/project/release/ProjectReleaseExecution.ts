import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { ReleaseReconcileResult } from '../../domain/release/ReleaseReconcileResult';

export interface ProjectReleaseExecution {
  readonly result: ReleaseReconcileResult;
  readonly historyRecorded: boolean;
  readonly historyFailure?: DeploymentFailure;
}
