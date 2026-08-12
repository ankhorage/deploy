import type { DeploymentExecutionResult } from '../../domain/DeploymentExecutionResult';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentPlan } from '../../domain/DeploymentPlan';
import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';
import { PROJECT_DEPLOYMENT_HISTORY_SCHEMA_VERSION } from '../history/historySchemaVersion';
import { recordProjectDeploymentHistory } from '../history/recordProjectDeploymentHistory';
import type { ProjectWebDeploymentInspection } from './ProjectWebDeploymentInspection';

export type RecordProjectWebHistoryResult =
  | { readonly recorded: true }
  | { readonly recorded: false; readonly failure: DeploymentFailure };

export async function recordProjectWebDeployment(options: {
  readonly inspection: ProjectWebDeploymentInspection;
  readonly plan: DeploymentPlan;
  readonly execution: DeploymentExecutionResult;
  readonly verification: DeploymentVerificationResult;
  readonly recordedAt: string;
}): Promise<RecordProjectWebHistoryResult> {
  const revision = options.inspection.desiredRevision;
  if (revision === undefined) return historyFailure('WEB_HISTORY_REVISION_MISSING');
  try {
    await recordProjectDeploymentHistory({
      projectRoot: options.inspection.projectRoot,
      record: {
        schemaVersion: PROJECT_DEPLOYMENT_HISTORY_SCHEMA_VERSION,
        deploymentId: `web-${revision}`,
        recordedAt: options.recordedAt,
        desired: options.inspection.desired,
        plan: options.plan,
        execution: options.execution,
        verification: options.verification,
      },
    });
    return { recorded: true };
  } catch {
    return historyFailure('WEB_HISTORY_RECORD_FAILED');
  }
}

function historyFailure(code: string): RecordProjectWebHistoryResult {
  return {
    recorded: false,
    failure: {
      code,
      message: 'Web deployment history could not be recorded.',
      target: 'web',
    },
  };
}
