import type { DeploymentPlanStep } from '../../domain/DeploymentPlanStep';
import type { DeploymentTargetChange } from '../../domain/DeploymentTargetChange';
import type { DeploymentTargetPlanContributor } from '../../domain/DeploymentTargetPlanContributor';

export function createAndroidTargetPlanContributor(): DeploymentTargetPlanContributor {
  return {
    target: 'android',
    capabilities: ['prepare', 'build', 'publish', 'verify'],
    createSteps: createAndroidSteps,
  };
}

function createAndroidSteps(change: DeploymentTargetChange): readonly DeploymentPlanStep[] {
  if (change.target !== 'android' || change.kind === 'none') return [];
  if (change.kind === 'remove') return [removeStep(change.reason)];
  return [
    step('android:prepare', 'prepare', 'run', 'eas', change.reason),
    step('android:build', 'build', change.kind, 'eas', change.reason),
    step('android:publish', 'publish', change.kind, 'google-play', change.reason),
    step('android:verify', 'verify', 'run', 'google-play', change.reason),
  ];
}

function removeStep(reason: string): DeploymentPlanStep {
  return step('android:remove', 'publish', 'remove', 'google-play', reason);
}

function step(
  id: string,
  phase: DeploymentPlanStep['phase'],
  operation: DeploymentPlanStep['operation'],
  provider: string,
  reason: string,
): DeploymentPlanStep {
  return { id, target: 'android', phase, operation, provider, reason };
}
