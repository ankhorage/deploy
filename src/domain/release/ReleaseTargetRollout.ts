import type { ReleaseRolloutMode } from './ReleaseRolloutMode';

export interface ReleaseTargetRollout {
  readonly mode: ReleaseRolloutMode;
  readonly initialFraction?: string;
}
