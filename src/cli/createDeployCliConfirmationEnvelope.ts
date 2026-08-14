import type { ReleasePlan } from '../index.js';
import type { ProjectReleaseInspection } from '../project/index.js';
import { DEPLOY_CLI_EXIT_CODES } from './DeployCliExitCodes.js';
import type { DeployCliJsonEnvelope } from './DeployCliJsonEnvelope.js';
import { redactDeployCliActions } from './redactDeployCliActions.js';
import { redactDeployCliPlan } from './redactDeployCliPlan.js';
import { redactDeployCliText } from './redactDeployCliText.js';

export function createDeployCliConfirmationEnvelope(
  inspection: ProjectReleaseInspection,
  plan: ReleasePlan,
  env: Readonly<Record<string, string | undefined>>,
): DeployCliJsonEnvelope {
  return {
    kind: 'ankh-deploy-result',
    version: 1,
    phase: 'confirmation',
    status: 'confirmation-required',
    exitCode: DEPLOY_CLI_EXIT_CODES.confirmationRequired,
    release: {
      version: redactDeployCliText(inspection.desired.version, env),
      targets: inspection.desired.targets,
      revision: redactDeployCliText(inspection.desired.revision, env),
    },
    plan: redactDeployCliPlan(plan, env),
    actions: redactDeployCliActions(inspection.actions, env),
  };
}
