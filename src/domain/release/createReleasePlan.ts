import { createAndroidReleaseSteps } from './createAndroidReleaseSteps';
import { createIosReleaseSteps } from './createIosReleaseSteps';
import { createReleaseCurrentRevision } from './createReleaseCurrentRevision';
import { createWebReleaseSteps } from './createWebReleaseSteps';
import type { ReleaseDesiredState } from './ReleaseDesiredState';
import type { ReleaseDiagnostic } from './ReleaseDiagnostic';
import type { ReleaseObservedState } from './ReleaseObservedState';
import type { ReleaseObservedTargetState } from './ReleaseObservedTargetState';
import type { ReleasePlan } from './ReleasePlan';
import type { ReleasePlanStep } from './ReleasePlanStep';
import type { ReleaseTarget } from './ReleaseTarget';
import type { ReleaseTargetPlanContribution } from './ReleaseTargetPlanContribution';

export function createReleasePlan(
  desired: ReleaseDesiredState,
  current: ReleaseObservedState,
): ReleasePlan {
  const diagnostics: ReleaseDiagnostic[] = [];
  const contributions: ReleaseTargetPlanContribution[] = [];
  for (const target of sortTargets(desired.targets)) {
    const observed = findTarget(current, target);
    if (observed === null) {
      diagnostics.push(missingTargetDiagnostic(target));
      continue;
    }
    contributions.push(createContribution(desired, observed));
  }
  diagnostics.push(...contributions.flatMap((item) => item.diagnostics));
  return finalizePlan(desired, current, contributions, diagnostics);
}

function finalizePlan(
  desired: ReleaseDesiredState,
  current: ReleaseObservedState,
  contributions: readonly ReleaseTargetPlanContribution[],
  diagnostics: readonly ReleaseDiagnostic[],
): ReleasePlan {
  const currentRevision = createReleaseCurrentRevision(current, desired.targets);
  if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return basePlan(desired, currentRevision, 'blocked', [], diagnostics);
  }
  const steps = contributions.flatMap((contribution) => contribution.steps);
  const waiting = contributions.some((contribution) => contribution.waiting);
  if (steps.length === 0) {
    return basePlan(desired, currentRevision, waiting ? 'waiting' : 'no-change', [], diagnostics);
  }
  const finalSteps = waiting ? steps : [...steps, recordStep(contributions)];
  return basePlan(desired, currentRevision, 'changes', finalSteps, diagnostics);
}

function basePlan(
  desired: ReleaseDesiredState,
  currentRevision: string,
  status: ReleasePlan['status'],
  steps: readonly ReleasePlanStep[],
  diagnostics: readonly ReleaseDiagnostic[],
): ReleasePlan {
  return {
    status,
    desiredRevision: desired.revision,
    currentRevision,
    steps,
    diagnostics,
  };
}

function createContribution(
  desired: ReleaseDesiredState,
  observed: ReleaseObservedTargetState,
): ReleaseTargetPlanContribution {
  switch (observed.target) {
    case 'web':
      return createWebReleaseSteps(desired, observed);
    case 'android':
      return createAndroidReleaseSteps(desired, observed);
    case 'ios':
      return createIosReleaseSteps(desired, observed);
  }
}

function findTarget(
  current: ReleaseObservedState,
  target: ReleaseTarget,
): ReleaseObservedTargetState | null {
  const matches = current.targets.filter((candidate) => candidate.target === target);
  return matches.length === 1 ? (matches[0] ?? null) : null;
}

function missingTargetDiagnostic(target: ReleaseTarget): ReleaseDiagnostic {
  return {
    severity: 'error',
    code: 'RELEASE_TARGET_STATE_INVALID',
    message: 'Exactly one observed state is required for each selected release target.',
    target,
  };
}

function recordStep(contributions: readonly ReleaseTargetPlanContribution[]): ReleasePlanStep {
  const dependsOn = contributions
    .flatMap((contribution) =>
      contribution.terminalStepId === undefined ? [] : [contribution.terminalStepId],
    )
    .sort();
  return {
    id: 'release:record',
    target: 'release',
    operation: 'record',
    dependsOn,
    retry: 'safe',
    irreversible: true,
  };
}

function sortTargets(targets: readonly ReleaseTarget[]): readonly ReleaseTarget[] {
  return targets.slice().sort((left, right) => targetRank(left) - targetRank(right));
}

function targetRank(target: ReleaseTarget): number {
  switch (target) {
    case 'web':
      return 0;
    case 'android':
      return 1;
    case 'ios':
      return 2;
  }
}
