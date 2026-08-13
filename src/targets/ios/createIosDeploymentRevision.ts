import { createHash } from 'node:crypto';

import type { IosDeploymentIntent } from '../../domain/IosDeploymentIntent';

export function createIosDeploymentRevision(
  fingerprint: string,
  intent: IosDeploymentIntent,
): string {
  const canonical = JSON.stringify({
    fingerprint,
    buildProfile: intent.buildProfile,
    version: intent.version,
  });
  return createHash('sha256').update(canonical).digest('hex');
}
