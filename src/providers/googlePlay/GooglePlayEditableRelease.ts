import type { ReleaseNote } from '../../domain/release/ReleaseNote';

export interface GooglePlayEditableRelease {
  readonly raw: Readonly<Record<string, unknown>>;
  readonly versionCodes: readonly string[];
  readonly releaseNotes: readonly ReleaseNote[];
  readonly status: 'draft' | 'inProgress' | 'halted' | 'completed';
  readonly userFraction?: string;
}
