import type { ReleaseNote } from './ReleaseNote';

export function areReleaseNotesSatisfied(
  desired: readonly ReleaseNote[],
  current: readonly ReleaseNote[],
): boolean {
  return desired.every((note) =>
    current.some((candidate) => candidate.locale === note.locale && candidate.text === note.text),
  );
}
