import type { ReleaseNote } from './ReleaseNote';

export interface ReleaseObservedIosState {
  readonly target: 'ios';
  readonly version: string | null;
  readonly artifactRevision: string | null;
  readonly buildNumber: string | null;
  readonly releaseNotes: readonly ReleaseNote[];
  readonly appVersionState?: string;
  readonly releaseType?: string;
  readonly reviewState?: string;
  readonly phasedReleaseState: 'INACTIVE' | 'ACTIVE' | 'PAUSED' | 'COMPLETE' | null;
}
