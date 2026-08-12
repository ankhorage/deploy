import { DEPLOYMENT_PLAN_DIAGNOSTIC_CODES } from '../../../domain/DeploymentPlanDiagnostic';
import { hasOnlyKeys } from '../../io/hasOnlyKeys';
import { isRecord } from '../../io/isRecord';
import { isTargetId } from './shared';

const DIAGNOSTIC_KEYS = new Set(['code', 'target', 'message', 'stepId']);

export function isPlanDiagnostic(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, DIAGNOSTIC_KEYS) &&
    DEPLOYMENT_PLAN_DIAGNOSTIC_CODES.some((code) => code === value.code) &&
    isTargetId(value.target) &&
    typeof value.message === 'string' &&
    (value.stepId === undefined || typeof value.stepId === 'string')
  );
}
