import type { ReleaseExecutionStep } from './ReleaseExecutionStep';

export interface ReleaseExecutionState {
  readonly releaseRevision: string;
  readonly steps: readonly ReleaseExecutionStep[];
}
