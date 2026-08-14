import type { DeployCliExitCode } from './DeployCliExitCode.js';

export interface DeployCliExecutionOutcome {
  readonly phase: 'execute' | 'history';
  readonly status: 'completed' | 'waiting' | 'blocked' | 'failed' | 'drifted' | 'history-failed';
  readonly exitCode: DeployCliExitCode;
}
