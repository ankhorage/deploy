import { createHash } from 'node:crypto';

import type { AndroidDeploymentIntent } from '../../domain/AndroidDeploymentIntent';

export function createAndroidDeploymentRevision(
  fingerprint: string,
  intent: AndroidDeploymentIntent,
): string {
  const canonical = JSON.stringify({
    fingerprint,
    buildProfile: intent.buildProfile,
    track: intent.track,
    releaseStatus: intent.releaseStatus,
  });
  return createHash('sha256').update(canonical).digest('hex');
}
