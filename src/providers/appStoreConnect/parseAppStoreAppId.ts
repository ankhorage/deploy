export function parseAppStoreAppId(value: unknown, bundleIdentifier: string): string | null {
  if (!isRecord(value) || !Array.isArray(value.data)) return null;
  let match: string | null = null;
  for (const item of value.data as unknown[]) {
    if (!isRecord(item) || item.type !== 'apps' || !isNonEmptyString(item.id)) continue;
    if (!isRecord(item.attributes) || item.attributes.bundleId !== bundleIdentifier) continue;
    if (match !== null) return null;
    match = item.id;
  }
  return match;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
