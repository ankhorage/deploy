import type { ReleaseObservedWebState } from '../../domain/release/ReleaseObservedWebState';
import type { WebDeploymentPublication } from '../../domain/WebDeploymentPublication';

type WebReleasePublication = WebDeploymentPublication | Pick<WebDeploymentPublication, 'revision'>;

export function createWebReleaseObservation(
  desiredVersion: string,
  publication: WebReleasePublication | null,
): ReleaseObservedWebState {
  return {
    target: 'web',
    version: publication === null ? null : desiredVersion,
    artifactRevision: publication?.revision ?? null,
  };
}
