import type { AppStoreReleaseSnapshot } from './AppStoreReleaseSnapshot';

const STATES = new Set(['INACTIVE', 'ACTIVE', 'PAUSED', 'COMPLETE']);

export function parseAppStorePhasedRelease(
  value: unknown,
): AppStoreReleaseSnapshot['phasedRelease'] | undefined {
  if (!isRecord(value) || !isRecord(value.data)) return undefined;
  const { data } = value;
  if (data.type !== 'appStoreVersionPhasedReleases' || !isNonEmptyString(data.id)) {
    return undefined;
  }
  if (!isRecord(data.attributes) || !isState(data.attributes.phasedReleaseState)) {
    return undefined;
  }
  if (!validOptionalNumber(data.attributes.currentDayNumber)) return undefined;
  if (!validOptionalNumber(data.attributes.totalPauseDuration)) return undefined;
  return {
    id: data.id,
    state: data.attributes.phasedReleaseState,
    ...(isNonEmptyString(data.attributes.startDate)
      ? { startDate: data.attributes.startDate }
      : {}),
    ...(typeof data.attributes.currentDayNumber === 'number'
      ? { currentDayNumber: data.attributes.currentDayNumber }
      : {}),
    ...(typeof data.attributes.totalPauseDuration === 'number'
      ? { totalPauseDuration: data.attributes.totalPauseDuration }
      : {}),
  };
}

function isState(
  value: unknown,
): value is NonNullable<AppStoreReleaseSnapshot['phasedRelease']>['state'] {
  return typeof value === 'string' && STATES.has(value);
}

function validOptionalNumber(value: unknown): boolean {
  return (
    value === undefined || value === null || (typeof value === 'number' && Number.isFinite(value))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
