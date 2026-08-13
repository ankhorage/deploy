import type { AppStoreReleaseSnapshot } from './AppStoreReleaseSnapshot';

const COMPLETE = 'COMPLETE';

export function parseAppStoreReviewSubmission(
  value: unknown,
  versionId: string,
): AppStoreReleaseSnapshot['reviewSubmission'] | undefined {
  if (!isRecord(value) || !Array.isArray(value.data)) return undefined;
  const matches = value.data
    .map((item) => parseSubmission(item, versionId))
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const active = matches.filter((item) => item.state !== COMPLETE);
  if (active.length > 1) return undefined;
  if (active.length === 1) return active[0] ?? undefined;
  const completed = matches.filter((item) => item.state === COMPLETE).sort(compareSubmissions);
  return completed[0] ?? null;
}

function parseSubmission(
  value: unknown,
  versionId: string,
): NonNullable<AppStoreReleaseSnapshot['reviewSubmission']> | null {
  if (!isRecord(value) || value.type !== 'reviewSubmissions' || !isNonEmptyString(value.id)) {
    return null;
  }
  if (!isRecord(value.attributes) || !isNonEmptyString(value.attributes.state)) return null;
  if (!referencesVersion(value, versionId)) return null;
  return {
    id: value.id,
    state: value.attributes.state,
    ...(isNonEmptyString(value.attributes.submittedDate)
      ? { submittedDate: value.attributes.submittedDate }
      : {}),
  };
}

function referencesVersion(value: Record<string, unknown>, versionId: string): boolean {
  if (!isRecord(value.relationships) || !isRecord(value.relationships.appStoreVersionForReview)) {
    return false;
  }
  const { data } = value.relationships.appStoreVersionForReview;
  return isRecord(data) && data.type === 'appStoreVersions' && data.id === versionId;
}

function compareSubmissions(
  left: NonNullable<AppStoreReleaseSnapshot['reviewSubmission']>,
  right: NonNullable<AppStoreReleaseSnapshot['reviewSubmission']>,
): number {
  const date = (right.submittedDate ?? '').localeCompare(left.submittedDate ?? '');
  return date !== 0 ? date : left.id.localeCompare(right.id);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
