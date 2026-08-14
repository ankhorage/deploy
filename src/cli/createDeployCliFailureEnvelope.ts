import type { DeploymentFailure } from '../index.js';
import { DEPLOY_CLI_EXIT_CODES } from './DeployCliExitCodes.js';
import type { DeployCliJsonEnvelope } from './DeployCliJsonEnvelope.js';
import { redactDeployCliFailure } from './redactDeployCliFailure.js';

export function createDeployCliFailureEnvelope(
  phase: 'input' | 'inspect' | 'execute',
  failure: DeploymentFailure,
  env: Readonly<Record<string, string | undefined>>,
): DeployCliJsonEnvelope {
  return {
    kind: 'ankh-deploy-result',
    version: 1,
    phase,
    status: 'failed',
    exitCode: DEPLOY_CLI_EXIT_CODES.failure,
    failure: redactDeployCliFailure(failure, env),
  };
}
