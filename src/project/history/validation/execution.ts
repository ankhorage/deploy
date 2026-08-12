import { hasOnlyKeys } from '../../io/hasOnlyKeys';
import { isRecord } from '../../io/isRecord';
import { isPlanDiagnostic } from './diagnostic';
import { isDeploymentFailure } from './failure';
import { isPlanStep } from './planStep';
import { isRequiredAction } from './requiredAction';
import { isStepOutcome } from './stepOutcome';

const RECORD_KEYS = new Set(['step', 'outcome']);
const BLOCKED_KEYS = new Set(['status', 'diagnostics', 'records']);
const COMPLETED_KEYS = new Set(['status', 'records']);
const ACTION_KEYS = new Set(['status', 'action', 'records']);
const FAILED_KEYS = new Set(['status', 'failure', 'records']);

export function isDeploymentExecution(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.records)) return false;
  if (!value.records.every(isExecutionRecord)) return false;
  if (value.status === 'completed') return hasOnlyKeys(value, COMPLETED_KEYS);
  if (value.status === 'blocked') return isBlocked(value);
  if (value.status === 'action-required') {
    return hasOnlyKeys(value, ACTION_KEYS) && isRequiredAction(value.action);
  }
  return (
    value.status === 'failed' &&
    hasOnlyKeys(value, FAILED_KEYS) &&
    isDeploymentFailure(value.failure)
  );
}

function isExecutionRecord(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, RECORD_KEYS) &&
    isPlanStep(value.step) &&
    isStepOutcome(value.outcome)
  );
}

function isBlocked(value: Record<string, unknown>): boolean {
  return (
    hasOnlyKeys(value, BLOCKED_KEYS) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isPlanDiagnostic)
  );
}
