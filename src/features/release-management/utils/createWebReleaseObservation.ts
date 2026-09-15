import type { WebDeploymentPublication } from '@ankhorage/contracts/deploy-provider';

import type { ReleaseObservedWebState } from '../../../domain/release/ReleaseObservedWebState';

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
