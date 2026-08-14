import type { ReleaseNote } from '../../domain/release/ReleaseNote';

export interface AppStoreReleaseSnapshot {
  readonly appId: string;
  readonly version: string;
  readonly versionId: string | null;
  readonly appVersionState?: string;
  readonly releaseType?: string;
  readonly releaseNotes: readonly ReleaseNote[];
  readonly reviewSubmission: {
    readonly id: string;
    readonly state: string;
    readonly submittedDate?: string;
  } | null;
  readonly phasedRelease: {
    readonly id: string;
    readonly state: 'INACTIVE' | 'ACTIVE' | 'PAUSED' | 'COMPLETE';
    readonly startDate?: string;
    readonly currentDayNumber?: number;
    readonly totalPauseDuration?: number;
  } | null;
}
