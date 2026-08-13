import type { ReleaseNote } from './ReleaseNote';

export function areReleaseNotesEqual(
  left: readonly ReleaseNote[],
  right: readonly ReleaseNote[],
): boolean {
  return JSON.stringify(canonicalNotes(left)) === JSON.stringify(canonicalNotes(right));
}

function canonicalNotes(notes: readonly ReleaseNote[]): readonly ReleaseNote[] {
  return notes.slice().sort((left, right) => {
    const locale = left.locale.localeCompare(right.locale);
    return locale !== 0 ? locale : left.text.localeCompare(right.text);
  });
}
