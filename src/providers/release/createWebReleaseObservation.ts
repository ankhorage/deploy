import type { ReleaseObservedWebState } from '../../domain/release/ReleaseObservedWebState';
import type { WebDeploymentPublication } from '../../domain/WebDeploymentPublication';

export function createWebReleaseObservation(
  desiredVersion: string,
  publication: WebDeploymentPublication | null,
): ReleaseObservedWebState {
  return {
    target: 'web',
    version: publication === null ? null : desiredVersion,
    artifactRevision: publication?.revision ?? null,
  };
}
