import type { AndroidDeploymentPublication } from '../../domain/AndroidDeploymentPublication';
import type { DeploymentExecutionResult } from '../../domain/DeploymentExecutionResult';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentPlan } from '../../domain/DeploymentPlan';
import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';
import { PROJECT_DEPLOYMENT_HISTORY_SCHEMA_VERSION } from '../history/historySchemaVersion';
import { recordProjectDeploymentHistory } from '../history/recordProjectDeploymentHistory';
import type { ProjectAndroidDeploymentInspection } from './ProjectAndroidDeploymentInspection';

export type RecordProjectAndroidHistoryResult =
  | { readonly recorded: true }
  | { readonly recorded: false; readonly failure: DeploymentFailure };

export async function recordProjectAndroidDeployment(options: {
  readonly inspection: ProjectAndroidDeploymentInspection;
  readonly publication: AndroidDeploymentPublication;
  readonly plan: DeploymentPlan;
  readonly execution: DeploymentExecutionResult;
  readonly verification: DeploymentVerificationResult;
  readonly recordedAt: string;
}): Promise<RecordProjectAndroidHistoryResult> {
  const revision = options.inspection.desiredRevision;
  if (revision === undefined) return historyFailure('ANDROID_HISTORY_REVISION_MISSING');
  try {
    await recordProjectDeploymentHistory({
      projectRoot: options.inspection.projectRoot,
      record: {
        schemaVersion: PROJECT_DEPLOYMENT_HISTORY_SCHEMA_VERSION,
        deploymentId: `android-${options.publication.versionCode}-${revision}`,
        recordedAt: options.recordedAt,
        desired: options.inspection.desired,
        plan: options.plan,
        execution: options.execution,
        verification: options.verification,
      },
    });
    return { recorded: true };
  } catch {
    return historyFailure('ANDROID_HISTORY_RECORD_FAILED');
  }
}

function historyFailure(code: string): RecordProjectAndroidHistoryResult {
  return {
    recorded: false,
    failure: {
      code,
      message: 'Android deployment history could not be recorded.',
      target: 'android',
    },
  };
}
