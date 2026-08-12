import type { DeploymentExecutionResult } from '../../domain/DeploymentExecutionResult';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentPlan } from '../../domain/DeploymentPlan';
import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';
import type { IosDeploymentPublication } from '../../domain/IosDeploymentPublication';
import { PROJECT_DEPLOYMENT_HISTORY_SCHEMA_VERSION } from '../history/historySchemaVersion';
import { recordProjectDeploymentHistory } from '../history/recordProjectDeploymentHistory';
import type { ProjectIosDeploymentInspection } from './ProjectIosDeploymentInspection';

export type RecordProjectIosHistoryResult =
  { readonly recorded: true } | { readonly recorded: false; readonly failure: DeploymentFailure };

export async function recordProjectIosDeployment(options: {
  readonly inspection: ProjectIosDeploymentInspection;
  readonly publication: IosDeploymentPublication;
  readonly plan: DeploymentPlan;
  readonly execution: DeploymentExecutionResult;
  readonly verification: DeploymentVerificationResult;
  readonly recordedAt: string;
}): Promise<RecordProjectIosHistoryResult> {
  const revision = options.inspection.desiredRevision;
  if (revision === undefined) return historyFailure('IOS_HISTORY_REVISION_MISSING');
  try {
    await recordProjectDeploymentHistory({
      projectRoot: options.inspection.projectRoot,
      record: {
        schemaVersion: PROJECT_DEPLOYMENT_HISTORY_SCHEMA_VERSION,
        deploymentId: `ios-${options.publication.buildNumber}-${revision}`,
        recordedAt: options.recordedAt,
        desired: options.inspection.desired,
        plan: options.plan,
        execution: options.execution,
        verification: options.verification,
      },
    });
    return { recorded: true };
  } catch {
    return historyFailure('IOS_HISTORY_RECORD_FAILED');
  }
}

function historyFailure(code: string): RecordProjectIosHistoryResult {
  return {
    recorded: false,
    failure: {
      code,
      message: 'iOS deployment history could not be recorded.',
      target: 'ios',
    },
  };
}
