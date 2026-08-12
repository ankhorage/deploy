import { hasOnlyKeys } from '../../io/hasOnlyKeys';
import { isRecord } from '../../io/isRecord';
import { isPlanDiagnostic } from './diagnostic';
import { isPlanStep } from './planStep';
import { isTargetChange } from './targetChange';

const PLAN_KEYS = new Set(['changes', 'steps', 'diagnostics', 'executable']);

export function isDeploymentPlan(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, PLAN_KEYS) &&
    Array.isArray(value.changes) &&
    value.changes.every(isTargetChange) &&
    Array.isArray(value.steps) &&
    value.steps.every(isPlanStep) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isPlanDiagnostic) &&
    typeof value.executable === 'boolean'
  );
}
