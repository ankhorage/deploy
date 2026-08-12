import type { DeploymentPlanStep } from '../../domain/DeploymentPlanStep';
import type { DeploymentTargetChange } from '../../domain/DeploymentTargetChange';
import type { DeploymentTargetPlanContributor } from '../../domain/DeploymentTargetPlanContributor';

export function createWebTargetPlanContributor(): DeploymentTargetPlanContributor {
  return {
    target: 'web',
    capabilities: ['prepare', 'publish', 'verify'],
    createSteps: createWebSteps,
  };
}

function createWebSteps(change: DeploymentTargetChange): readonly DeploymentPlanStep[] {
  if (change.target !== 'web' || change.kind === 'none') return [];
  if (change.kind === 'remove') {
    return [
      {
        id: 'web:remove',
        target: 'web',
        phase: 'publish',
        operation: 'remove',
        provider: 'eas',
        reason: change.reason,
      },
    ];
  }
  return [
    createStep('web:prepare', 'prepare', 'run', 'expo', change.reason),
    createStep('web:publish', 'publish', change.kind, 'eas', change.reason),
    createStep('web:verify', 'verify', 'run', 'eas', change.reason),
  ];
}

function createStep(
  id: string,
  phase: DeploymentPlanStep['phase'],
  operation: DeploymentPlanStep['operation'],
  provider: string,
  reason: string,
): DeploymentPlanStep {
  return { id, target: 'web', phase, operation, provider, reason };
}
