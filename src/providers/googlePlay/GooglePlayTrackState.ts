import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';

export interface GooglePlayReleaseState {
  readonly lifecycle: string;
  readonly versionCodes: readonly number[];
}

export interface GooglePlayTrackState {
  readonly track: AndroidDeploymentTrack;
  readonly releases: readonly GooglePlayReleaseState[];
}

export function parseGooglePlayTrackState(
  value: unknown,
  track: AndroidDeploymentTrack,
): GooglePlayTrackState | null {
  if (!isRecord(value) || !Array.isArray(value.releases)) return null;
  const releases: GooglePlayReleaseState[] = [];
  for (const release of value.releases) {
    const parsed = parseRelease(release);
    if (parsed === null) return null;
    releases.push(parsed);
  }
  return { track, releases };
}

function parseRelease(value: unknown): GooglePlayReleaseState | null {
  if (!isRecord(value) || !isNonEmptyString(value.releaseLifecycleState)) return null;
  if (!Array.isArray(value.activeArtifacts)) return null;
  const versionCodes: number[] = [];
  for (const artifact of value.activeArtifacts) {
    if (!isRecord(artifact) || !isVersionCode(artifact.versionCode)) return null;
    versionCodes.push(artifact.versionCode);
  }
  return { lifecycle: value.releaseLifecycleState, versionCodes };
}

function isVersionCode(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
