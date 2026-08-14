export function parseAppStoreReleaseVersion(
  value: unknown,
  expectedVersion: string,
):
  | {
      readonly versionId: string;
      readonly appVersionState: string;
      readonly releaseType?: string;
    }
  | null
  | undefined {
  if (!isRecord(value) || !Array.isArray(value.data)) return undefined;
  let match: Record<string, unknown> | null = null;
  for (const candidate of value.data as unknown[]) {
    if (!matches(candidate, expectedVersion)) continue;
    if (match !== null || !isRecord(candidate)) return undefined;
    match = candidate;
  }
  if (match === null) return null;
  if (!isNonEmptyString(match.id) || !isRecord(match.attributes)) return undefined;
  if (!isNonEmptyString(match.attributes.appVersionState)) return undefined;
  return {
    versionId: match.id,
    appVersionState: match.attributes.appVersionState,
    ...(isNonEmptyString(match.attributes.releaseType)
      ? { releaseType: match.attributes.releaseType }
      : {}),
  };
}

function matches(value: unknown, expectedVersion: string): boolean {
  if (!isRecord(value) || value.type !== 'appStoreVersions' || !isRecord(value.attributes)) {
    return false;
  }
  return value.attributes.platform === 'IOS' && value.attributes.versionString === expectedVersion;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
