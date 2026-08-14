import type { ReleaseDiagnostic } from '../../domain/release/ReleaseDiagnostic';
import type { ReleasePlan } from '../../domain/release/ReleasePlan';
import type { ReleasePlanStatus } from '../../domain/release/ReleasePlanStatus';
import { hasOnlyKeys } from '../io/hasOnlyKeys';
import { isRecord } from '../io/isRecord';
import { parseReleaseHistoryPlanStep } from './parseReleaseHistoryPlanStep';

const KEYS = new Set(['status', 'desiredRevision', 'currentRevision', 'steps', 'diagnostics']);
const DIAGNOSTIC_KEYS = new Set(['severity', 'code', 'message', 'target']);
const STATUSES = new Set<ReleasePlanStatus>(['no-change', 'changes', 'waiting', 'blocked']);
const TARGETS = new Set(['web', 'android', 'ios', 'release']);

export function parseReleaseHistoryPlan(value: unknown): ReleasePlan {
  if (!isRecord(value) || !hasOnlyKeys(value, KEYS)) throw invalid();
  if (!isStatus(value.status)) throw invalid();
  if (!isNonEmptyString(value.desiredRevision) || !isNonEmptyString(value.currentRevision)) {
    throw invalid();
  }
  if (!Array.isArray(value.steps) || !Array.isArray(value.diagnostics)) throw invalid();
  return {
    status: value.status,
    desiredRevision: value.desiredRevision,
    currentRevision: value.currentRevision,
    steps: value.steps.map(parseReleaseHistoryPlanStep),
    diagnostics: value.diagnostics.map(parseDiagnostic),
  };
}

function parseDiagnostic(value: unknown): ReleaseDiagnostic {
  if (!isRecord(value) || !hasOnlyKeys(value, DIAGNOSTIC_KEYS)) throw invalid();
  if (value.severity !== 'warning' && value.severity !== 'error') throw invalid();
  if (!isNonEmptyString(value.code) || !isNonEmptyString(value.message)) throw invalid();
  if (value.target !== undefined && !isTarget(value.target)) throw invalid();
  return {
    severity: value.severity,
    code: value.code,
    message: value.message,
    ...(value.target === undefined ? {} : { target: value.target }),
  };
}

function isStatus(value: unknown): value is ReleasePlanStatus {
  return typeof value === 'string' && STATUSES.has(value as ReleasePlanStatus);
}

function isTarget(value: unknown): value is ReleaseDiagnostic['target'] {
  return typeof value === 'string' && TARGETS.has(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function invalid(): Error {
  return new Error('Release history has an invalid plan.');
}
