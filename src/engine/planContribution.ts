import type { DeploymentPlanDiagnostic } from '../domain/DeploymentPlanDiagnostic';
import type { DeploymentPlanStep } from '../domain/DeploymentPlanStep';
import type { DeploymentTargetChange } from '../domain/DeploymentTargetChange';
import type { DeploymentTargetPlanContributor } from '../domain/DeploymentTargetPlanContributor';
import { validatePlanStep } from './validatePlanStep';

export interface MutableDeploymentPlan {
  readonly diagnostics: DeploymentPlanDiagnostic[];
  readonly stepIds: Set<string>;
  readonly steps: DeploymentPlanStep[];
}

export function appendTargetContribution(
  change: DeploymentTargetChange,
  contributor: DeploymentTargetPlanContributor,
  plan: MutableDeploymentPlan,
): void {
  if (contributor.target !== change.target) {
    plan.diagnostics.push({
      code: 'CONTRIBUTOR_TARGET_MISMATCH',
      target: change.target,
      message: 'The registered target planner declares a different target.',
    });
    return;
  }

  const steps = safelyCreateSteps(change, contributor, plan.diagnostics);
  for (const step of steps) appendValidStep(step, change, contributor, plan);
}

function safelyCreateSteps(
  change: DeploymentTargetChange,
  contributor: DeploymentTargetPlanContributor,
  diagnostics: DeploymentPlanDiagnostic[],
): readonly DeploymentPlanStep[] {
  try {
    return contributor.createSteps(change);
  } catch {
    diagnostics.push({
      code: 'TARGET_PLANNER_FAILED',
      target: change.target,
      message: 'The target planner failed while creating deployment steps.',
    });
    return [];
  }
}

function appendValidStep(
  step: DeploymentPlanStep,
  change: DeploymentTargetChange,
  contributor: DeploymentTargetPlanContributor,
  plan: MutableDeploymentPlan,
): void {
  const diagnostic = validatePlanStep(step, change, contributor, plan.stepIds);
  if (diagnostic !== null) {
    plan.diagnostics.push(diagnostic);
    return;
  }
  plan.stepIds.add(step.id);
  plan.steps.push(step);
}
