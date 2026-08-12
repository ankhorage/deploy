import { DEPLOYMENT_CAPABILITIES } from '../../../domain/DeploymentCapability';
import { DEPLOYMENT_STEP_OPERATIONS } from '../../../domain/DeploymentPlanStep';
import { hasOnlyKeys } from '../../io/hasOnlyKeys';
import { isRecord } from '../../io/isRecord';
import { isNonEmptyString, isTargetId } from './shared';

const STEP_KEYS = new Set(['id', 'target', 'phase', 'operation', 'provider', 'reason']);

export function isPlanStep(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, STEP_KEYS) &&
    isNonEmptyString(value.id) &&
    isTargetId(value.target) &&
    DEPLOYMENT_CAPABILITIES.some((phase) => phase === value.phase) &&
    DEPLOYMENT_STEP_OPERATIONS.some((operation) => operation === value.operation) &&
    (value.provider === undefined || isNonEmptyString(value.provider)) &&
    typeof value.reason === 'string'
  );
}
