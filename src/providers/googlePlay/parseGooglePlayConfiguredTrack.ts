import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';
import type { ReleaseNote } from '../../domain/release/ReleaseNote';
import type { GooglePlayReleaseSnapshot } from './GooglePlayReleaseSnapshot';

const STATUSES = new Set(['draft', 'inProgress', 'halted', 'completed']);

export function parseGooglePlayConfiguredTrack(
  value: unknown,
  expectedTrack: AndroidDeploymentTrack,
): GooglePlayReleaseSnapshot['releases'] | null {
  if (!isRecord(value) || value.track !== expectedTrack) return null;
  if (value.releases === undefined) return [];
  if (!Array.isArray(value.releases)) return null;
  const releases = value.releases.map(parseRelease);
  if (releases.some((release) => release === null)) return null;
  return releases
    .filter((release): release is NonNullable<typeof release> => release !== null)
    .sort(compareReleases);
}

function parseRelease(value: unknown): GooglePlayReleaseSnapshot['releases'][number] | null {
  if (!isRecord(value) || !isStatus(value.status)) return null;
  const versionCodes = parseVersionCodes(value.versionCodes);
  const releaseNotes = parseNotes(value.releaseNotes);
  if (versionCodes === null || releaseNotes === null) return null;
  const userFraction = parseFraction(value.userFraction, value.status);
  if (userFraction === null) return null;
  return {
    status: value.status,
    versionCodes,
    releaseNotes,
    ...(userFraction === undefined ? {} : { userFraction }),
  };
}

function parseVersionCodes(value: unknown): readonly string[] | null {
  if (!Array.isArray(value)) return null;
  const codes: string[] = [];
  for (const code of value as unknown[]) {
    if (typeof code !== 'string' || !/^[1-9]\d*$/.test(code)) return null;
    codes.push(code);
  }
  return codes.sort((left, right) => left.localeCompare(right));
}

function parseNotes(value: unknown): readonly ReleaseNote[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const notes: ReleaseNote[] = [];
  for (const item of value as unknown[]) {
    const note = parseNote(item);
    if (note === null) return null;
    notes.push(note);
  }
  notes.sort((left, right) => left.locale.localeCompare(right.locale));
  if (new Set(notes.map((note) => note.locale)).size !== notes.length) return null;
  return notes;
}

function parseNote(value: unknown): ReleaseNote | null {
  if (!isRecord(value) || typeof value.text !== 'string') return null;
  const locale = normalizeLocale(value.language);
  if (locale === null) return null;
  return { locale, text: value.text };
}

function parseFraction(
  value: unknown,
  status: GooglePlayReleaseSnapshot['releases'][number]['status'],
): string | undefined | null {
  if (status !== 'inProgress' && status !== 'halted') {
    return value === undefined ? undefined : null;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const text = String(value);
  return /^0\.\d+$/.test(text) && text !== '0.0' ? text : null;
}

function compareReleases(
  left: GooglePlayReleaseSnapshot['releases'][number],
  right: GooglePlayReleaseSnapshot['releases'][number],
): number {
  const versions = left.versionCodes.join(',').localeCompare(right.versionCodes.join(','));
  return versions !== 0 ? versions : left.status.localeCompare(right.status);
}

function isStatus(
  value: unknown,
): value is GooglePlayReleaseSnapshot['releases'][number]['status'] {
  return typeof value === 'string' && STATUSES.has(value);
}

function normalizeLocale(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  try {
    const locales = Intl.getCanonicalLocales(value);
    return locales.length === 1 ? (locales[0] ?? null) : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
