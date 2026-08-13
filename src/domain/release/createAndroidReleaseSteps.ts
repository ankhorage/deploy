import { areReleaseNotesSatisfied } from './areReleaseNotesSatisfied';
import { normalizeReleaseFraction } from './normalizeReleaseFraction';
import type { ReleaseDesiredState } from './ReleaseDesiredState';
import type { ReleaseObservedAndroidState } from './ReleaseObservedAndroidState';
import type { ReleasePlanStep } from './ReleasePlanStep';
import type { ReleaseTargetPlanContribution } from './ReleaseTargetPlanContribution';
import type { ReleaseTargetRollout } from './ReleaseTargetRollout';

export function createAndroidReleaseSteps(
  desired: ReleaseDesiredState,
  current: ReleaseObservedAndroidState,
): ReleaseTargetPlanContribution {
  if (current.rolloutStatus === 'halted') return haltedContribution();
  const rollout = desired.rollout.android ?? { mode: 'immediate' };
  const artifactReady = isArtifactReady(desired, current);
  const notesMatch = areReleaseNotesSatisfied(desired.notes, current.releaseNotes);
  if (artifactReady && notesMatch && rolloutSatisfied(rollout, current)) {
    return { steps: [], diagnostics: [], waiting: false, complete: true };
  }
  const steps = createMutableSteps(desired, current, rollout, artifactReady, notesMatch);
  const verify = verificationStep(steps);
  return {
    steps: [...steps, verify],
    diagnostics: [],
    waiting: false,
    complete: false,
    terminalStepId: verify.id,
  };
}

function createMutableSteps(
  desired: ReleaseDesiredState,
  current: ReleaseObservedAndroidState,
  rollout: ReleaseTargetRollout,
  artifactReady: boolean,
  notesMatch: boolean,
): ReleasePlanStep[] {
  const steps: ReleasePlanStep[] = [];
  if (!artifactReady) steps.push(step('android:publish', 'publish', [], 'reinspect'));
  if (!notesMatch) {
    steps.push(step('android:sync-notes', 'sync-notes', lastDependency(steps), 'reinspect'));
  }
  if (needsRolloutMutation(rollout, current, artifactReady)) {
    const operation = rollout.mode === 'staged' ? 'rollout' : 'release';
    steps.push(step(`android:${operation}`, operation, lastDependency(steps), 'reinspect'));
  }
  return steps;
}

function rolloutSatisfied(
  rollout: ReleaseTargetRollout,
  current: ReleaseObservedAndroidState,
): boolean {
  if (current.rolloutStatus === 'completed') return true;
  if (rollout.mode !== 'staged' || current.rolloutStatus !== 'inProgress') return false;
  return (
    normalizeReleaseFraction(current.userFraction) ===
    normalizeReleaseFraction(rollout.initialFraction)
  );
}

function needsRolloutMutation(
  rollout: ReleaseTargetRollout,
  current: ReleaseObservedAndroidState,
  artifactReady: boolean,
): boolean {
  return !artifactReady || !rolloutSatisfied(rollout, current);
}

function isArtifactReady(
  desired: ReleaseDesiredState,
  current: ReleaseObservedAndroidState,
): boolean {
  return (
    current.version === desired.version &&
    current.artifactRevision !== null &&
    current.versionCodes.length > 0
  );
}

function verificationStep(steps: readonly ReleasePlanStep[]): ReleasePlanStep {
  return step('android:verify', 'verify', lastDependency(steps), 'safe');
}

function step(
  id: string,
  operation: ReleasePlanStep['operation'],
  dependsOn: readonly string[],
  retry: ReleasePlanStep['retry'],
): ReleasePlanStep {
  return { id, target: 'android', operation, dependsOn, retry, irreversible: false };
}

function lastDependency(steps: readonly ReleasePlanStep[]): readonly string[] {
  const last = steps.at(-1);
  return last === undefined ? [] : [last.id];
}

function haltedContribution(): ReleaseTargetPlanContribution {
  return {
    steps: [],
    diagnostics: [
      {
        severity: 'warning',
        code: 'ANDROID_ROLLOUT_HALTED',
        message: 'The Google Play staged rollout is halted and will not be resumed implicitly.',
        target: 'android',
      },
    ],
    waiting: true,
    complete: false,
  };
}
