import type { ReleaseNote } from './ReleaseNote';
import type { ReleaseRollout } from './ReleaseRollout';
import type { ReleaseTarget } from './ReleaseTarget';

export interface ReleaseDesiredState {
  readonly version: string;
  readonly targets: readonly ReleaseTarget[];
  readonly notes: readonly ReleaseNote[];
  readonly rollout: ReleaseRollout;
  readonly revision: string;
}
