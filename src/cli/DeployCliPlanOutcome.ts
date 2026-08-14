import type { DeployCliExitCode } from './DeployCliExitCode.js';

export interface DeployCliPlanOutcome {
  readonly status: 'planned' | 'no-change' | 'action-required' | 'waiting' | 'blocked';
  readonly exitCode: DeployCliExitCode;
}
