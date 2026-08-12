import { hasOnlyKeys } from '../../io/hasOnlyKeys';
import { isRecord } from '../../io/isRecord';
import { isNonEmptyString, isTargetId } from './shared';

const AUTH_KEYS = new Set(['type', 'provider', 'target', 'code', 'message']);
const MANUAL_KEYS = new Set(['type', 'target', 'provider', 'code', 'message', 'url']);

export function isRequiredAction(value: unknown): boolean {
  if (!isRecord(value)) return false;

  if (value.type === 'authentication') {
    return (
      hasOnlyKeys(value, AUTH_KEYS) &&
      isNonEmptyString(value.provider) &&
      (value.target === undefined || isTargetId(value.target)) &&
      isNonEmptyString(value.code) &&
      typeof value.message === 'string'
    );
  }

  return isManualAction(value);
}

function isManualAction(value: Record<string, unknown>): boolean {
  return (
    value.type === 'manual-action' &&
    hasOnlyKeys(value, MANUAL_KEYS) &&
    isTargetId(value.target) &&
    (value.provider === undefined || isNonEmptyString(value.provider)) &&
    isNonEmptyString(value.code) &&
    typeof value.message === 'string' &&
    (value.url === undefined || typeof value.url === 'string')
  );
}
