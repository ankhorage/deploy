import { createHash } from 'node:crypto';

import type { ReleaseNote } from './ReleaseNote';
import type { ReleaseRollout } from './ReleaseRollout';
import type { ReleaseTarget } from './ReleaseTarget';

export function createReleaseRevision(options: {
  readonly version: string;
  readonly targets: readonly ReleaseTarget[];
  readonly notes: readonly ReleaseNote[];
  readonly rollout: ReleaseRollout;
}): string {
  const canonical = {
    version: options.version,
    targets: options.targets.slice().sort(),
    notes: options.notes.slice().sort((a, b) => a.locale.localeCompare(b.locale)),
    rollout: options.rollout,
  };
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
