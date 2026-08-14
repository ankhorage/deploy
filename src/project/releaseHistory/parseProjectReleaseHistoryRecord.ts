import { isIsoTimestamp } from '../history/validation/isIsoTimestamp';
import { hasOnlyKeys } from '../io/hasOnlyKeys';
import { isRecord } from '../io/isRecord';
import { parseReleaseHistoryDesired } from './parseReleaseHistoryDesired';
import { parseReleaseHistoryExecution } from './parseReleaseHistoryExecution';
import { parseReleaseHistoryPlan } from './parseReleaseHistoryPlan';
import { parseReleaseHistoryResult } from './parseReleaseHistoryResult';
import type { ProjectReleaseHistoryRecord } from './ProjectReleaseHistoryRecord';

const KEYS = new Set([
  'schemaVersion',
  'executionId',
  'recordedAt',
  'desired',
  'initialPlan',
  'result',
  'execution',
]);

export function parseProjectReleaseHistoryRecord(value: unknown): ProjectReleaseHistoryRecord {
  if (!isRecord(value) || !hasOnlyKeys(value, KEYS)) throw invalid();
  if (value.schemaVersion !== 1 || !isNonEmptyString(value.executionId)) throw invalid();
  if (!isIsoTimestamp(value.recordedAt)) throw invalid();
  const desired = parseReleaseHistoryDesired(value.desired);
  const initialPlan = parseReleaseHistoryPlan(value.initialPlan);
  const result = parseReleaseHistoryResult(value.result);
  const execution = parseReleaseHistoryExecution(value.execution);
  validateConsistency(desired.revision, initialPlan, result, execution);
  return {
    schemaVersion: 1,
    executionId: value.executionId,
    recordedAt: value.recordedAt,
    desired,
    initialPlan,
    result,
    execution,
  };
}

function validateConsistency(
  revision: string,
  initialPlan: ProjectReleaseHistoryRecord['initialPlan'],
  result: ProjectReleaseHistoryRecord['result'],
  execution: ProjectReleaseHistoryRecord['execution'],
): void {
  if (initialPlan.desiredRevision !== revision || result.plan.desiredRevision !== revision) {
    throw invalid();
  }
  if (execution.releaseRevision !== revision) throw invalid();
  const plannedIds = initialPlan.steps.map((step) => step.id);
  const executionIds = execution.steps.map((item) => item.step.id);
  if (JSON.stringify(plannedIds) !== JSON.stringify(executionIds)) throw invalid();
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function invalid(): Error {
  return new Error('Release history record has an invalid canonical shape.');
}
