import type { ReleaseDesiredState } from './ReleaseDesiredState';
import type { ReleaseObservedWebState } from './ReleaseObservedWebState';
import type { ReleasePlanStep } from './ReleasePlanStep';
import type { ReleaseTargetPlanContribution } from './ReleaseTargetPlanContribution';

export function createWebReleaseSteps(
  desired: ReleaseDesiredState,
  current: ReleaseObservedWebState,
): ReleaseTargetPlanContribution {
  if (current.version === desired.version && current.artifactRevision !== null) {
    return { steps: [], diagnostics: [], waiting: false, complete: true };
  }
  const publish: ReleasePlanStep = {
    id: 'web:publish',
    target: 'web',
    operation: 'publish',
    dependsOn: [],
    retry: 'reinspect',
    irreversible: false,
  };
  const verify: ReleasePlanStep = {
    id: 'web:verify',
    target: 'web',
    operation: 'verify',
    dependsOn: [publish.id],
    retry: 'safe',
    irreversible: false,
  };
  return {
    steps: [publish, verify],
    diagnostics: [],
    waiting: false,
    complete: false,
    terminalStepId: verify.id,
  };
}
