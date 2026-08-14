import type { ReleaseNote } from '../../domain/release/ReleaseNote';

export function parseAppStoreReleaseNotes(value: unknown): readonly ReleaseNote[] | null {
  if (!isRecord(value) || !Array.isArray(value.data)) return null;
  const notes: ReleaseNote[] = [];
  for (const item of value.data as unknown[]) {
    const note = parseNote(item);
    if (note === null) return null;
    if (note !== undefined) notes.push(note);
  }
  notes.sort((left, right) => left.locale.localeCompare(right.locale));
  if (new Set(notes.map((note) => note.locale)).size !== notes.length) return null;
  return notes;
}

function parseNote(value: unknown): ReleaseNote | null | undefined {
  if (!isRecord(value) || value.type !== 'appStoreVersionLocalizations') return null;
  if (!isRecord(value.attributes)) return null;
  const locale = normalizeLocale(value.attributes.locale);
  if (locale === null) return null;
  const { whatsNew } = value.attributes;
  if (whatsNew === null || whatsNew === undefined || whatsNew === '') return undefined;
  return typeof whatsNew === 'string' ? { locale, text: whatsNew } : null;
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
