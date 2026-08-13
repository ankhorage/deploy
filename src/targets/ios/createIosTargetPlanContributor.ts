import type { DeploymentPlanStep } from '../../domain/DeploymentPlanStep';
import type { DeploymentTargetChange } from '../../domain/DeploymentTargetChange';
import type { DeploymentTargetPlanContributor } from '../../domain/DeploymentTargetPlanContributor';

export function createIosTargetPlanContributor(): DeploymentTargetPlanContributor {
  return {
    target: 'ios',
    capabilities: ['prepare', 'build', 'publish', 'verify'],
    createSteps: createIosSteps,
  };
}

function createIosSteps(change: DeploymentTargetChange): readonly DeploymentPlanStep[] {
  if (change.target !== 'ios' || change.kind === 'none') return [];
  if (change.kind === 'remove') return [removeStep(change.reason)];
  return [
    step('ios:prepare', 'prepare', 'run', 'eas', change.reason),
    step('ios:build', 'build', change.kind, 'eas', change.reason),
    step('ios:publish', 'publish', change.kind, 'app-store-connect', change.reason),
    step('ios:verify', 'verify', 'run', 'app-store-connect', change.reason),
  ];
}

function removeStep(reason: string): DeploymentPlanStep {
  return step('ios:remove', 'publish', 'remove', 'app-store-connect', reason);
}

function step(
  id: string,
  phase: DeploymentPlanStep['phase'],
  operation: DeploymentPlanStep['operation'],
  provider: string,
  reason: string,
): DeploymentPlanStep {
  return { id, target: 'ios', phase, operation, provider, reason };
}
