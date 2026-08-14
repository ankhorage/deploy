import type { ReleaseReconcileResult } from '../../domain/release/ReleaseReconcileResult';
import { hasOnlyKeys } from '../io/hasOnlyKeys';
import { isRecord } from '../io/isRecord';
import { parseReleaseHistoryPlan } from './parseReleaseHistoryPlan';

const KEYS = new Set([
  'status',
  'plan',
  'currentRevision',
  'executedStepIds',
  'attemptedStepId',
  'code',
]);
const STATUSES = new Set<ReleaseReconcileResult['status']>([
  'completed',
  'waiting',
  'blocked',
  'failed',
  'drifted',
]);

export function parseReleaseHistoryResult(value: unknown): ReleaseReconcileResult {
  if (!isRecord(value) || !hasOnlyKeys(value, KEYS)) throw invalid();
  if (!isStatus(value.status) || !isNonEmptyString(value.currentRevision)) throw invalid();
  const plan = parseReleaseHistoryPlan(value.plan);
  if (plan.currentRevision !== value.currentRevision) throw invalid();
  const executedStepIds = parseStepIds(value.executedStepIds);
  const attemptedStepId = parseOptionalString(value.attemptedStepId);
  const code = parseOptionalString(value.code);
  return {
    status: value.status,
    plan,
    currentRevision: value.currentRevision,
    executedStepIds,
    ...(attemptedStepId === undefined ? {} : { attemptedStepId }),
    ...(code === undefined ? {} : { code }),
  };
}

function parseStepIds(value: unknown): readonly string[] {
  if (!Array.isArray(value) || !value.every(isNonEmptyString)) throw invalid();
  if (new Set(value).size !== value.length) throw invalid();
  return value.slice();
}

function parseOptionalString(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (!isNonEmptyString(value)) throw invalid();
  return value;
}

function isStatus(value: unknown): value is ReleaseReconcileResult['status'] {
  return typeof value === 'string' && STATUSES.has(value as ReleaseReconcileResult['status']);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function invalid(): Error {
  return new Error('Release history has an invalid execution result.');
}
