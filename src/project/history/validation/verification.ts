import { hasOnlyKeys } from '../../io/hasOnlyKeys';
import { isRecord } from '../../io/isRecord';
import { isNonEmptyString, isTargetId } from './shared';

const ISSUE_KEYS = new Set(['code', 'message', 'target', 'provider']);

export function isDeploymentVerification(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.ok === true) return hasOnlyKeys(value, new Set(['ok']));

  return (
    value.ok === false &&
    hasOnlyKeys(value, new Set(['ok', 'issues'])) &&
    Array.isArray(value.issues) &&
    value.issues.every(isVerificationIssue)
  );
}

function isVerificationIssue(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ISSUE_KEYS) &&
    isNonEmptyString(value.code) &&
    typeof value.message === 'string' &&
    (value.target === undefined || isTargetId(value.target)) &&
    (value.provider === undefined || isNonEmptyString(value.provider))
  );
}
