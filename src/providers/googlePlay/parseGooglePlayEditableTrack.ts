import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';
import type { ReleaseNote } from '../../domain/release/ReleaseNote';
import type { GooglePlayEditableRelease } from './GooglePlayEditableRelease';
import type { GooglePlayEditableTrack } from './GooglePlayEditableTrack';

const STATUSES = new Set(['draft', 'inProgress', 'halted', 'completed']);

export function parseGooglePlayEditableTrack(
  value: unknown,
  expectedTrack: AndroidDeploymentTrack,
): GooglePlayEditableTrack | null {
  if (!isRecord(value) || value.track !== expectedTrack || !Array.isArray(value.releases)) {
    return null;
  }
  const releases: GooglePlayEditableRelease[] = [];
  for (const item of value.releases as unknown[]) {
    const release = parseRelease(item);
    if (release === null) return null;
    releases.push(release);
  }
  return { track: expectedTrack, releases };
}

function parseRelease(value: unknown): GooglePlayEditableRelease | null {
  if (!isRecord(value) || !isStatus(value.status)) return null;
  const versionCodes = parseVersionCodes(value.versionCodes);
  const releaseNotes = parseReleaseNotes(value.releaseNotes);
  if (versionCodes === null || releaseNotes === null) return null;
  const userFraction = parseUserFraction(value.userFraction, value.status);
  if (userFraction === null) return null;
  return {
    raw: value,
    versionCodes,
    releaseNotes,
    status: value.status,
    ...(userFraction === undefined ? {} : { userFraction }),
  };
}

function parseVersionCodes(value: unknown): readonly string[] | null {
  if (!Array.isArray(value)) return null;
  const result: string[] = [];
  for (const code of value as unknown[]) {
    if (typeof code !== 'string' || !/^[1-9]\d*$/.test(code)) return null;
    result.push(code);
  }
  return result;
}

function parseReleaseNotes(value: unknown): readonly ReleaseNote[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const result: ReleaseNote[] = [];
  for (const item of value as unknown[]) {
    const note = parseReleaseNote(item);
    if (note === null) return null;
    result.push(note);
  }
  return result;
}

function parseReleaseNote(value: unknown): ReleaseNote | null {
  if (!isRecord(value) || typeof value.text !== 'string') return null;
  const locale = normalizeLocale(value.language);
  return locale === null ? null : { locale, text: value.text };
}

function parseUserFraction(
  value: unknown,
  status: GooglePlayEditableRelease['status'],
): string | undefined | null {
  if (status !== 'inProgress' && status !== 'halted') {
    return value === undefined ? undefined : null;
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value >= 1) return null;
  return String(value);
}

function isStatus(value: unknown): value is GooglePlayEditableRelease['status'] {
  return typeof value === 'string' && STATUSES.has(value);
}

function normalizeLocale(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  try {
    return Intl.getCanonicalLocales(value)[0] ?? null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
