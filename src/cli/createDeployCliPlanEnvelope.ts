import type { ReleasePlan } from '../index.js';
import type { ProjectReleaseInspection } from '../project/index.js';
import type { DeployCliJsonEnvelope } from './DeployCliJsonEnvelope.js';
import type { DeployCliPlanOutcome } from './DeployCliPlanOutcome.js';
import { redactDeployCliActions } from './redactDeployCliActions.js';
import { redactDeployCliPlan } from './redactDeployCliPlan.js';
import { redactDeployCliText } from './redactDeployCliText.js';

export function createDeployCliPlanEnvelope(
  inspection: ProjectReleaseInspection,
  plan: ReleasePlan,
  outcome: DeployCliPlanOutcome,
  env: Readonly<Record<string, string | undefined>>,
): DeployCliJsonEnvelope {
  return {
    kind: 'ankh-deploy-result',
    version: 1,
    phase: 'plan',
    status: outcome.status,
    exitCode: outcome.exitCode,
    release: {
      version: redactDeployCliText(inspection.desired.version, env),
      targets: inspection.desired.targets,
      revision: redactDeployCliText(inspection.desired.revision, env),
    },
    plan: redactDeployCliPlan(plan, env),
    actions: redactDeployCliActions(inspection.actions, env),
  };
}
