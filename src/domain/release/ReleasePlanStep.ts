import type { ReleaseStepOperation } from './ReleaseStepOperation';
import type { ReleaseStepRetry } from './ReleaseStepRetry';
import type { ReleaseTarget } from './ReleaseTarget';

export interface ReleasePlanStep {
  readonly id: string;
  readonly target: ReleaseTarget | 'release';
  readonly operation: ReleaseStepOperation;
  readonly dependsOn: readonly string[];
  readonly retry: ReleaseStepRetry;
  readonly irreversible: boolean;
}
