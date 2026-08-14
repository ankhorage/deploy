import type {
  DeploymentFailure,
  DeploymentRequiredAction,
  ReleasePlan,
  ReleaseTarget,
} from '../index.js';
import type { DeployCliExitCode } from './DeployCliExitCode.js';

/**
 * Versioned machine-readable result emitted by `ankh deploy --json`.
 *
 * Exactly one JSON document is written to stdout. JSON mode never opens an
 * interactive confirmation prompt; mutating execution therefore requires
 * explicit `--yes`.
 */
export interface DeployCliJsonEnvelope {
  readonly kind: 'ankh-deploy-result';
  readonly version: 1;
  readonly phase: 'input' | 'inspect' | 'plan' | 'confirmation' | 'execute' | 'history';
  readonly status:
    | 'planned'
    | 'no-change'
    | 'action-required'
    | 'waiting'
    | 'blocked'
    | 'confirmation-required'
    | 'declined'
    | 'completed'
    | 'failed'
    | 'drifted'
    | 'history-failed';
  readonly exitCode: DeployCliExitCode;
  readonly release?: {
    readonly version: string;
    readonly targets: readonly ReleaseTarget[];
    readonly revision: string;
  };
  readonly plan?: ReleasePlan;
  readonly actions?: readonly DeploymentRequiredAction[];
  readonly execution?: {
    readonly id: string;
    readonly status: 'completed' | 'waiting' | 'blocked' | 'failed' | 'drifted';
    readonly currentRevision: string;
    readonly executedStepIds: readonly string[];
    readonly attemptedStepId?: string;
    readonly code?: string;
    readonly historyRecorded: boolean;
  };
  readonly failure?: DeploymentFailure;
}
