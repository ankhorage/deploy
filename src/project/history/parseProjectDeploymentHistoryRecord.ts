import { isAppDeployManifest } from '@ankhorage/contracts/deploy';

import { hasOnlyKeys } from '../io/hasOnlyKeys';
import { isRecord } from '../io/isRecord';
import { isSafeSegment } from '../io/assertSafeSegment';
import { PROJECT_DEPLOYMENT_HISTORY_SCHEMA_VERSION } from './historySchemaVersion';
import type { ProjectDeploymentHistoryRecord } from './ProjectDeploymentHistoryRecord';
import { isDeploymentExecution } from './validation/execution';
import { isIsoTimestamp } from './validation/isIsoTimestamp';
import { isDeploymentPlan } from './validation/plan';
import { isDeploymentVerification } from './validation/verification';

const HISTORY_KEYS = new Set([
  'schemaVersion', 'deploymentId', 'recordedAt', 'desired',
  'plan', 'execution', 'verification',
]);

export function parseProjectDeploymentHistoryRecord(
  value: unknown,
): ProjectDeploymentHistoryRecord {
  if (isRecord(value) && value.schemaVersion !== PROJECT_DEPLOYMENT_HISTORY_SCHEMA_VERSION) {
    throw new Error(`Unsupported deployment history schema version: ${String(value.schemaVersion)}`);
  }
  if (!isHistoryRecord(value)) {
    throw new Error('Deployment history record has an invalid canonical shape.');
  }
  return value;
}

function isHistoryRecord(value: unknown): value is ProjectDeploymentHistoryRecord {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, HISTORY_KEYS) &&
    value.schemaVersion === PROJECT_DEPLOYMENT_HISTORY_SCHEMA_VERSION &&
    typeof value.deploymentId === 'string' &&
    isSafeSegment(value.deploymentId) &&
    isIsoTimestamp(value.recordedAt) &&
    (value.desired === null || isAppDeployManifest(value.desired)) &&
    isDeploymentPlan(value.plan) &&
    isDeploymentExecution(value.execution) &&
    (value.verification === undefined || isDeploymentVerification(value.verification))
  );
}
