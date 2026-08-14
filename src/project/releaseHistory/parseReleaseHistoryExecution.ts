import type { ReleaseExecutionState } from '../../domain/release/ReleaseExecutionState';
import type { ReleaseExecutionStep } from '../../domain/release/ReleaseExecutionStep';
import { hasOnlyKeys } from '../io/hasOnlyKeys';
import { isRecord } from '../io/isRecord';
import { parseReleaseHistoryPlanStep } from './parseReleaseHistoryPlanStep';

const ROOT_KEYS = new Set(['releaseRevision', 'steps']);
const STEP_KEYS = new Set(['step', 'status', 'attempts', 'code']);
const STATUSES = new Set<ReleaseExecutionStep['status']>([
  'pending',
  'completed',
  'failed',
  'waiting',
  'cancelled',
]);

export function parseReleaseHistoryExecution(value: unknown): ReleaseExecutionState {
  if (!isRecord(value) || !hasOnlyKeys(value, ROOT_KEYS)) throw invalid();
  if (!isNonEmptyString(value.releaseRevision) || !Array.isArray(value.steps)) throw invalid();
  return {
    releaseRevision: value.releaseRevision,
    steps: value.steps.map(parseExecutionStep),
  };
}

function parseExecutionStep(value: unknown): ReleaseExecutionStep {
  if (!isRecord(value) || !hasOnlyKeys(value, STEP_KEYS)) throw invalid();
  if (!isStatus(value.status) || !Number.isInteger(value.attempts)) throw invalid();
  if (typeof value.attempts !== 'number' || value.attempts < 0) throw invalid();
  const code = parseOptionalString(value.code);
  return {
    step: parseReleaseHistoryPlanStep(value.step),
    status: value.status,
    attempts: value.attempts,
    ...(code === undefined ? {} : { code }),
  };
}

function parseOptionalString(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (!isNonEmptyString(value)) throw invalid();
  return value;
}

function isStatus(value: unknown): value is ReleaseExecutionStep['status'] {
  return typeof value === 'string' && STATUSES.has(value as ReleaseExecutionStep['status']);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function invalid(): Error {
  return new Error('Release history has an invalid execution state.');
}
