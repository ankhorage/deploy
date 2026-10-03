import { APP_DEPLOY_TARGET_IDS } from '@ankhorage/contracts/deploy';

/*** Narrow unknown history payload values to plain records. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/*** Reject unknown fields from canonical history payload objects. */
export function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isTargetId(value: unknown): value is 'web' | 'android' | 'ios' {
  return APP_DEPLOY_TARGET_IDS.some((target) => target === value);
}
