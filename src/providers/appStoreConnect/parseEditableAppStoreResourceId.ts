import { isEditableAppStoreListingState } from './isEditableAppStoreListingState';

export function parseEditableAppStoreResourceId(
  value: unknown,
  type: 'appInfos' | 'appStoreVersions',
): string | null | undefined {
  if (!isRecord(value) || !Array.isArray(value.data)) return undefined;
  let match: string | null = null;
  for (const item of value.data as unknown[]) {
    if (!isRecord(item) || item.type !== type || !isNonEmptyString(item.id)) continue;
    if (!isRecord(item.attributes)) return undefined;
    const state =
      type === 'appInfos'
        ? (item.attributes.state ?? item.attributes.appStoreState)
        : (item.attributes.appVersionState ?? item.attributes.appStoreState);
    if (!isEditableAppStoreListingState(state)) continue;
    if (match !== null) return undefined;
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
