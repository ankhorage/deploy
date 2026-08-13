import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';
import type { ReleaseNote } from '../../domain/release/ReleaseNote';
import type { GooglePlayTrackState } from './GooglePlayTrackState';

export interface GooglePlayReleaseSnapshot {
  readonly track: AndroidDeploymentTrack;
  readonly summary: GooglePlayTrackState;
  readonly releases: readonly {
    readonly status: 'draft' | 'inProgress' | 'halted' | 'completed';
    readonly versionCodes: readonly string[];
    readonly releaseNotes: readonly ReleaseNote[];
    readonly userFraction?: string;
  }[];
}
