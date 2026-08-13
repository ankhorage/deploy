import { areReleaseNotesEqual } from './areReleaseNotesEqual';
import type { ReleaseDesiredState } from './ReleaseDesiredState';
import type { ReleaseDiagnostic } from './ReleaseDiagnostic';
import type { ReleaseObservedIosState } from './ReleaseObservedIosState';
import type { ReleasePlanStep } from './ReleasePlanStep';
import type { ReleaseTargetPlanContribution } from './ReleaseTargetPlanContribution';

const REVIEW_WAITING = new Set([
  'WAITING_FOR_REVIEW',
  'IN_REVIEW',
  'WAITING_FOR_EXPORT_COMPLIANCE',
]);
const RELEASED = new Set(['READY_FOR_DISTRIBUTION', 'READY_FOR_SALE']);
const REJECTED = new Set(['REJECTED', 'METADATA_REJECTED', 'DEVELOPER_REJECTED']);

export function createIosReleaseSteps(
  desired: ReleaseDesiredState,
  current: ReleaseObservedIosState,
): ReleaseTargetPlanContribution {
  if (isRejected(current))
    return blocked('IOS_RELEASE_REJECTED', 'The iOS release needs manual correction.');
  const lockedConflict = lockedStateConflict(desired, current);
  if (lockedConflict !== null) return blocked(lockedConflict.code, lockedConflict.message);
  const rolloutConflict = immediateRolloutConflict(desired, current);
  if (rolloutConflict !== null) return blocked(rolloutConflict.code, rolloutConflict.message);

  const steps = createMutableMetadataSteps(desired, current);
  const rolloutResult = appendRolloutStep(desired, current, steps);
  if (rolloutResult !== null) return rolloutResult;
  if (isReleased(current)) return releasedContribution(steps);
  if (isWaitingForReview(current)) return waitingContribution(steps);
  if (isReadyForRelease(current)) return releaseContribution(steps);
  if (current.reviewState === 'COMPLETE') return processingContribution(steps);
  return submitReviewContribution(steps);
}

function createMutableMetadataSteps(
  desired: ReleaseDesiredState,
  current: ReleaseObservedIosState,
): ReleasePlanStep[] {
  const steps: ReleasePlanStep[] = [];
  if (!isArtifactReady(desired, current)) {
    steps.push(step('ios:publish', 'publish', [], 'reinspect', false));
  }
  if (!areReleaseNotesEqual(desired.notes, current.releaseNotes)) {
    steps.push(step('ios:sync-notes', 'sync-notes', lastDependency(steps), 'reinspect', false));
  }
  return steps;
}

function appendRolloutStep(
  desired: ReleaseDesiredState,
  current: ReleaseObservedIosState,
  steps: ReleasePlanStep[],
): ReleaseTargetPlanContribution | null {
  const mode = desired.rollout.ios?.mode ?? 'immediate';
  if (mode === 'staged') return appendStagedRollout(current, steps);
  return appendImmediateRollout(current, steps);
}

function appendStagedRollout(
  current: ReleaseObservedIosState,
  steps: ReleasePlanStep[],
): ReleaseTargetPlanContribution | null {
  if (current.phasedReleaseState === 'PAUSED') {
    return waiting(
      steps,
      'IOS_PHASED_RELEASE_PAUSED',
      'The App Store phased release is paused and will not be resumed implicitly.',
    );
  }
  if (current.phasedReleaseState !== null) return null;
  if (isReleased(current)) {
    return blocked(
      'IOS_PHASED_RELEASE_NOT_CONFIGURED',
      'Phased release was not configured before the iOS version was released.',
    );
  }
  steps.push(step('ios:rollout', 'rollout', lastDependency(steps), 'reinspect', false));
  return null;
}

function appendImmediateRollout(
  current: ReleaseObservedIosState,
  steps: ReleasePlanStep[],
): ReleaseTargetPlanContribution | null {
  if (current.phasedReleaseState === null || current.phasedReleaseState === 'COMPLETE') return null;
  if (current.phasedReleaseState === 'INACTIVE') {
    return blocked(
      'IOS_PHASED_RELEASE_CONFLICT',
      'A planned phased release conflicts with immediate iOS release intent.',
    );
  }
  if (!isReleased(current)) return null;
  steps.push(step('ios:rollout', 'rollout', lastDependency(steps), 'reinspect', true));
  return null;
}

function lockedStateConflict(
  desired: ReleaseDesiredState,
  current: ReleaseObservedIosState,
): ReleaseDiagnostic | null {
  const locked = isWaitingForReview(current) || isReadyForRelease(current) || isReleased(current);
  if (!locked) return null;
  if (!isArtifactReady(desired, current)) {
    return diagnostic(
      'IOS_RELEASE_ARTIFACT_DRIFT_LOCKED',
      'The iOS review/release lifecycle is locked to a different artifact.',
    );
  }
  if (!areReleaseNotesEqual(desired.notes, current.releaseNotes)) {
    return diagnostic(
      'IOS_RELEASE_NOTES_DRIFT_LOCKED',
      'The iOS review/release lifecycle is locked with different release notes.',
    );
  }
  return null;
}

function immediateRolloutConflict(
  desired: ReleaseDesiredState,
  current: ReleaseObservedIosState,
): ReleaseDiagnostic | null {
  const mode = desired.rollout.ios?.mode ?? 'immediate';
  if (mode !== 'immediate' || current.phasedReleaseState !== 'INACTIVE') return null;
  return diagnostic(
    'IOS_PHASED_RELEASE_CONFLICT',
    'A planned phased release conflicts with immediate iOS release intent.',
  );
}

function releasedContribution(steps: readonly ReleasePlanStep[]): ReleaseTargetPlanContribution {
  if (steps.length === 0) return { steps: [], diagnostics: [], waiting: false, complete: true };
  return verifiedContribution(steps);
}

function releaseContribution(steps: readonly ReleasePlanStep[]): ReleaseTargetPlanContribution {
  const release = step('ios:release', 'release', lastDependency(steps), 'never', true);
  return verifiedContribution([...steps, release]);
}

function submitReviewContribution(
  steps: readonly ReleasePlanStep[],
): ReleaseTargetPlanContribution {
  const submit = step(
    'ios:submit-review',
    'submit-review',
    lastDependency(steps),
    'reinspect',
    false,
  );
  return waiting(
    [...steps, submit],
    'IOS_REVIEW_PENDING',
    'The iOS release will wait for App Review after submission.',
  );
}

function verifiedContribution(steps: readonly ReleasePlanStep[]): ReleaseTargetPlanContribution {
  const verify = step('ios:verify', 'verify', lastDependency(steps), 'safe', false);
  return {
    steps: [...steps, verify],
    diagnostics: [],
    waiting: false,
    complete: false,
    terminalStepId: verify.id,
  };
}

function waitingContribution(steps: readonly ReleasePlanStep[]): ReleaseTargetPlanContribution {
  return waiting(
    steps,
    'IOS_REVIEW_PENDING',
    'The iOS release is waiting for the current App Review lifecycle.',
  );
}

function processingContribution(steps: readonly ReleasePlanStep[]): ReleaseTargetPlanContribution {
  return waiting(
    steps,
    'IOS_RELEASE_PROCESSING',
    'App Review is complete but the iOS version is not yet ready for release.',
  );
}

function waiting(
  steps: readonly ReleasePlanStep[],
  code: string,
  message: string,
): ReleaseTargetPlanContribution {
  return {
    steps,
    diagnostics: [{ severity: 'warning', code, message, target: 'ios' }],
    waiting: true,
    complete: false,
  };
}

function blocked(code: string, message: string): ReleaseTargetPlanContribution {
  return {
    steps: [],
    diagnostics: [{ severity: 'error', code, message, target: 'ios' }],
    waiting: false,
    complete: false,
  };
}

function diagnostic(code: string, message: string): ReleaseDiagnostic {
  return { severity: 'error', code, message, target: 'ios' };
}

function step(
  id: string,
  operation: ReleasePlanStep['operation'],
  dependsOn: readonly string[],
  retry: ReleasePlanStep['retry'],
  irreversible: boolean,
): ReleasePlanStep {
  return { id, target: 'ios', operation, dependsOn, retry, irreversible };
}

function lastDependency(steps: readonly ReleasePlanStep[]): readonly string[] {
  const last = steps.at(-1);
  return last === undefined ? [] : [last.id];
}

function isArtifactReady(desired: ReleaseDesiredState, current: ReleaseObservedIosState): boolean {
  return (
    current.version === desired.version &&
    current.artifactRevision !== null &&
    current.buildNumber !== null
  );
}

function isWaitingForReview(current: ReleaseObservedIosState): boolean {
  return (
    (current.appVersionState !== undefined && REVIEW_WAITING.has(current.appVersionState)) ||
    (current.reviewState !== undefined && REVIEW_WAITING.has(current.reviewState))
  );
}

function isReadyForRelease(current: ReleaseObservedIosState): boolean {
  return current.appVersionState === 'PENDING_DEVELOPER_RELEASE';
}

function isReleased(current: ReleaseObservedIosState): boolean {
  return current.appVersionState !== undefined && RELEASED.has(current.appVersionState);
}

function isRejected(current: ReleaseObservedIosState): boolean {
  return (
    (current.appVersionState !== undefined && REJECTED.has(current.appVersionState)) ||
    (current.reviewState !== undefined && REJECTED.has(current.reviewState))
  );
}
