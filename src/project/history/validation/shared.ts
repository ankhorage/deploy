import { APP_DEPLOY_TARGET_IDS } from '@ankhorage/contracts/deploy';

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isTargetId(value: unknown): value is 'web' | 'android' | 'ios' {
  return APP_DEPLOY_TARGET_IDS.some((target) => target === value);
}
