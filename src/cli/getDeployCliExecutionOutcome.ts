import type { ProjectReleaseExecution } from '../project/index.js';
import type { DeployCliExecutionOutcome } from './DeployCliExecutionOutcome.js';
import { DEPLOY_CLI_EXIT_CODES } from './DeployCliExitCodes.js';

export function getDeployCliExecutionOutcome(
  execution: ProjectReleaseExecution,
): DeployCliExecutionOutcome {
  if (!execution.historyRecorded) {
    return { phase: 'history', status: 'history-failed', exitCode: DEPLOY_CLI_EXIT_CODES.failure };
  }
  switch (execution.result.status) {
    case 'completed':
      return { phase: 'execute', status: 'completed', exitCode: DEPLOY_CLI_EXIT_CODES.success };
    case 'waiting':
      return { phase: 'execute', status: 'waiting', exitCode: DEPLOY_CLI_EXIT_CODES.blocked };
    case 'blocked':
      return { phase: 'execute', status: 'blocked', exitCode: DEPLOY_CLI_EXIT_CODES.blocked };
    case 'failed':
      return { phase: 'execute', status: 'failed', exitCode: DEPLOY_CLI_EXIT_CODES.failure };
    case 'drifted':
      return { phase: 'execute', status: 'drifted', exitCode: DEPLOY_CLI_EXIT_CODES.drifted };
  }
}
