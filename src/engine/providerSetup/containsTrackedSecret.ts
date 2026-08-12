import { isRecord } from './isRecord';

export function containsTrackedSecret(value: unknown, secrets: ReadonlySet<string>): boolean {
  if (typeof value === 'string') {
    return [...secrets].some((secret) => secret.length > 0 && value.includes(secret));
  }
  if (Array.isArray(value)) return value.some((item) => containsTrackedSecret(item, secrets));
  if (!isRecord(value)) return false;
  return Object.values(value).some((item) => containsTrackedSecret(item, secrets));
}
