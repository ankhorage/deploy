import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { DeploymentCurrentState } from '../domain/DeploymentCurrentState';
import type { DeploymentDesiredRevisions } from '../domain/DeploymentDesiredRevisions';
import type { DeploymentPlan } from '../domain/DeploymentPlan';
import type { DeploymentTargetPlanContributors } from '../domain/DeploymentTargetPlanContributor';
import { createDeploymentChanges } from './createDeploymentChanges';
import { appendTargetContribution, type MutableDeploymentPlan } from './planContribution';

export interface CreateDeploymentPlanInput {
  readonly desired: AppDeployManifest;
  readonly current: DeploymentCurrentState;
  readonly desiredRevisions?: DeploymentDesiredRevisions;
  readonly contributors: DeploymentTargetPlanContributors;
}

export function createDeploymentPlan(input: CreateDeploymentPlanInput): DeploymentPlan {
  const changes = createDeploymentChanges(input);
  const mutable: MutableDeploymentPlan = {
    diagnostics: [],
    stepIds: new Set<string>(),
    steps: [],
  };

  for (const change of changes) {
    if (change.kind === 'none') continue;
    const contributor = input.contributors[change.target];
    if (contributor === undefined) {
      mutable.diagnostics.push({
        code: 'TARGET_PLANNER_UNAVAILABLE',
        target: change.target,
        message: 'No target planner is registered for an actionable deployment change.',
      });
      continue;
    }
    appendTargetContribution(change, contributor, mutable);
  }

  return {
    changes,
    steps: mutable.steps,
    diagnostics: mutable.diagnostics,
    executable: mutable.diagnostics.length === 0,
  };
}
