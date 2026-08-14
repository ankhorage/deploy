import type { IosDeploymentPublication } from '../../domain/IosDeploymentPublication';
import type { ReleaseObservedIosState } from '../../domain/release/ReleaseObservedIosState';
import type { AppStoreReleaseSnapshot } from './AppStoreReleaseSnapshot';

export function normalizeAppStoreReleaseObservation(options: {
  readonly publication: IosDeploymentPublication | null;
  readonly publicationVerified: boolean;
  readonly snapshot: AppStoreReleaseSnapshot;
}): ReleaseObservedIosState {
  const publication = matchingPublication(options);
  return {
    target: 'ios',
    version: options.snapshot.versionId === null ? null : options.snapshot.version,
    artifactRevision: publication?.revision ?? null,
    buildNumber: publication?.buildNumber ?? null,
    releaseNotes: options.snapshot.releaseNotes,
    ...(options.snapshot.appVersionState === undefined
      ? {}
      : { appVersionState: options.snapshot.appVersionState }),
    ...(options.snapshot.releaseType === undefined
      ? {}
      : { releaseType: options.snapshot.releaseType }),
    ...(options.snapshot.reviewSubmission === null
      ? {}
      : { reviewState: options.snapshot.reviewSubmission.state }),
    phasedReleaseState: options.snapshot.phasedRelease?.state ?? null,
  };
}

function matchingPublication(
  options: Parameters<typeof normalizeAppStoreReleaseObservation>[0],
): IosDeploymentPublication | null {
  if (!options.publicationVerified || options.publication === null) return null;
  if (options.snapshot.versionId === null) return null;
  return options.publication.version === options.snapshot.version ? options.publication : null;
}
