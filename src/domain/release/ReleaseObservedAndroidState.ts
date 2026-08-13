import type { ReleaseNote } from './ReleaseNote';

export interface ReleaseObservedAndroidState {
  readonly target: 'android';
  readonly version: string | null;
  readonly artifactRevision: string | null;
  readonly versionCodes: readonly string[];
  readonly releaseNotes: readonly ReleaseNote[];
  readonly rolloutStatus: 'missing' | 'draft' | 'inProgress' | 'halted' | 'completed';
  readonly userFraction?: string;
}
