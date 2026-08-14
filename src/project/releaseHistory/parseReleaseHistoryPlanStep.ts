import type { ReleasePlanStep } from '../../domain/release/ReleasePlanStep';
import type { ReleaseStepOperation } from '../../domain/release/ReleaseStepOperation';
import type { ReleaseStepRetry } from '../../domain/release/ReleaseStepRetry';
import { hasOnlyKeys } from '../io/hasOnlyKeys';
import { isRecord } from '../io/isRecord';

const KEYS = new Set(['id', 'target', 'operation', 'dependsOn', 'retry', 'irreversible']);
const TARGETS = new Set(['web', 'android', 'ios', 'release']);
const OPERATIONS = new Set<ReleaseStepOperation>([
  'prepare',
  'build',
  'publish',
  'sync-notes',
  'submit-review',
  'release',
  'rollout',
  'verify',
  'record',
]);
const RETRIES = new Set<ReleaseStepRetry>(['safe', 'reinspect', 'never']);

export function parseReleaseHistoryPlanStep(value: unknown): ReleasePlanStep {
  if (!isRecord(value) || !hasOnlyKeys(value, KEYS)) throw invalid();
  if (!isNonEmptyString(value.id) || !isTarget(value.target)) throw invalid();
  if (!isOperation(value.operation) || !isRetry(value.retry)) throw invalid();
  if (typeof value.irreversible !== 'boolean') throw invalid();
  const dependsOn = parseDependencies(value.dependsOn);
  return {
    id: value.id,
    target: value.target,
    operation: value.operation,
    dependsOn,
    retry: value.retry,
    irreversible: value.irreversible,
  };
}

function parseDependencies(value: unknown): readonly string[] {
  if (!Array.isArray(value) || !value.every(isNonEmptyString)) throw invalid();
  if (new Set(value).size !== value.length) throw invalid();
  return value.slice();
}

function isTarget(value: unknown): value is ReleasePlanStep['target'] {
  return typeof value === 'string' && TARGETS.has(value);
}

function isOperation(value: unknown): value is ReleaseStepOperation {
  return typeof value === 'string' && OPERATIONS.has(value as ReleaseStepOperation);
}

function isRetry(value: unknown): value is ReleaseStepRetry {
  return typeof value === 'string' && RETRIES.has(value as ReleaseStepRetry);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function invalid(): Error {
  return new Error('Release history has an invalid plan step.');
}
