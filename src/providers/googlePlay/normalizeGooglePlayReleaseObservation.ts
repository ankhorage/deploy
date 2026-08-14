import type { AndroidDeploymentPublication } from '../../domain/AndroidDeploymentPublication';
import type { ReleaseObservedAndroidState } from '../../domain/release/ReleaseObservedAndroidState';
import type { GooglePlayReleaseSnapshot } from './GooglePlayReleaseSnapshot';

export function normalizeGooglePlayReleaseObservation(options: {
  readonly desiredVersion: string;
  readonly publication: AndroidDeploymentPublication | null;
  readonly snapshot: GooglePlayReleaseSnapshot;
}): ReleaseObservedAndroidState {
  const { publication } = options;
  if (publication?.track !== options.snapshot.track) return missing();
  const code = String(publication.versionCode);
  const matches = options.snapshot.releases.filter((release) =>
    release.versionCodes.includes(code),
  );
  if (matches.length !== 1) return missing();
  const [release] = matches;
  if (release === undefined) return missing();
  return {
    target: 'android',
    version: options.desiredVersion,
    artifactRevision: publication.revision,
    versionCodes: release.versionCodes,
    releaseNotes: release.releaseNotes,
    rolloutStatus: release.status,
    ...(release.userFraction === undefined ? {} : { userFraction: release.userFraction }),
  };
}

function missing(): ReleaseObservedAndroidState {
  return {
    target: 'android',
    version: null,
    artifactRevision: null,
    versionCodes: [],
    releaseNotes: [],
    rolloutStatus: 'missing',
  };
}
