import type { ReleaseNote } from '../../domain/release/ReleaseNote';

export function mergeGooglePlayReleaseNotes(
  desired: readonly ReleaseNote[],
  current: readonly ReleaseNote[],
): readonly { readonly language: string; readonly text: string }[] {
  const notes = new Map<string, string>();
  for (const note of current) notes.set(note.locale, note.text);
  for (const note of desired) notes.set(note.locale, note.text);
  return [...notes.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([language, text]) => ({ language, text }));
}
