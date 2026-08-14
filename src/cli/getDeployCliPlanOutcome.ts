import type { ReleasePlan } from '../index.js';
import type { ProjectReleaseInspection } from '../project/index.js';
import { DEPLOY_CLI_EXIT_CODES } from './DeployCliExitCodes.js';
import type { DeployCliPlanOutcome } from './DeployCliPlanOutcome.js';

export function getDeployCliPlanOutcome(
  inspection: ProjectReleaseInspection,
  plan: ReleasePlan,
): DeployCliPlanOutcome {
  if (plan.status === 'blocked') {
    return { status: 'blocked', exitCode: DEPLOY_CLI_EXIT_CODES.blocked };
  }
  if (inspection.actions.length > 0) {
    return { status: 'action-required', exitCode: DEPLOY_CLI_EXIT_CODES.blocked };
  }
  if (plan.status === 'waiting') {
    return { status: 'waiting', exitCode: DEPLOY_CLI_EXIT_CODES.blocked };
  }
  if (plan.status === 'no-change') {
    return { status: 'no-change', exitCode: DEPLOY_CLI_EXIT_CODES.success };
  }
  return { status: 'planned', exitCode: DEPLOY_CLI_EXIT_CODES.success };
}
