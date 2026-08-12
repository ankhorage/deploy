import { hasOnlyKeys } from '../../io/hasOnlyKeys';
import { isRecord } from '../../io/isRecord';
import { isNonEmptyString, isTargetId } from './shared';

const FAILURE_KEYS = new Set(['code', 'message', 'target', 'provider']);

export function isDeploymentFailure(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, FAILURE_KEYS) &&
    isNonEmptyString(value.code) &&
    typeof value.message === 'string' &&
    (value.target === undefined || isTargetId(value.target)) &&
    (value.provider === undefined || isNonEmptyString(value.provider))
  );
}
