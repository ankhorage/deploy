import type { ReleaseObservedTargetState } from './ReleaseObservedTargetState';

export interface ReleaseObservedState {
  readonly targets: readonly ReleaseObservedTargetState[];
}
