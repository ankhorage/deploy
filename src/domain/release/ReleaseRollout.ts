import type { ReleaseTargetRollout } from './ReleaseTargetRollout';

export interface ReleaseRollout {
  readonly web?: ReleaseTargetRollout;
  readonly android?: ReleaseTargetRollout;
  readonly ios?: ReleaseTargetRollout;
}
