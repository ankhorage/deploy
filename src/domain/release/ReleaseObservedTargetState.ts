import type { ReleaseNote } from './ReleaseNote';
import type { ReleaseTarget } from './ReleaseTarget';

export interface ReleaseObservedTargetState {
  readonly target: ReleaseTarget;
  readonly version: string;
  readonly versionExists: boolean;
  readonly releaseNotes: readonly ReleaseNote[];
  readonly androidRolloutStatus?: 'draft' | 'inProgress' | 'halted' | 'completed';
  readonly androidUserFraction?: string;
  readonly iosAppVersionState?: string;
  readonly iosReleaseType?: string;
  readonly iosReviewState?: string;
  readonly iosPhasedReleaseState?: 'INACTIVE' | 'ACTIVE' | 'PAUSED' | 'COMPLETE' | null;
}
