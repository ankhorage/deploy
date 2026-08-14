import { createHash } from 'node:crypto';

import { normalizeReleaseFraction } from './normalizeReleaseFraction';
import type { ReleaseNote } from './ReleaseNote';
import type { ReleaseObservedState } from './ReleaseObservedState';
import type { ReleaseObservedTargetState } from './ReleaseObservedTargetState';
import type { ReleaseTarget } from './ReleaseTarget';

export function createReleaseCurrentRevision(
  state: ReleaseObservedState,
  selectedTargets: readonly ReleaseTarget[],
): string {
  const targets = state.targets
    .filter((target) => selectedTargets.includes(target.target))
    .map(canonicalTarget)
    .sort((left, right) => left.target.localeCompare(right.target));
  return createHash('sha256').update(JSON.stringify(targets)).digest('hex');
}

function canonicalTarget(state: ReleaseObservedTargetState): CanonicalReleaseTarget {
  switch (state.target) {
    case 'web':
      return {
        target: state.target,
        version: state.version,
        artifactRevision: state.artifactRevision,
      };
    case 'android':
      return canonicalAndroid(state);
    case 'ios':
      return canonicalIos(state);
  }
}

function canonicalAndroid(
  state: Extract<ReleaseObservedTargetState, { readonly target: 'android' }>,
): CanonicalReleaseTarget {
  return {
    target: state.target,
    version: state.version,
    artifactRevision: state.artifactRevision,
    versionCodes: state.versionCodes.slice().sort(),
    releaseNotes: canonicalNotes(state.releaseNotes),
    rolloutStatus: state.rolloutStatus,
    userFraction: normalizeReleaseFraction(state.userFraction) ?? null,
  };
}

function canonicalIos(
  state: Extract<ReleaseObservedTargetState, { readonly target: 'ios' }>,
): CanonicalReleaseTarget {
  return {
    target: state.target,
    version: state.version,
    artifactRevision: state.artifactRevision,
    buildNumber: state.buildNumber,
    releaseNotes: canonicalNotes(state.releaseNotes),
    appVersionState: state.appVersionState ?? null,
    releaseType: state.releaseType ?? null,
    reviewState: state.reviewState ?? null,
    phasedReleaseState: state.phasedReleaseState,
  };
}

function canonicalNotes(notes: readonly ReleaseNote[]): readonly ReleaseNote[] {
  return notes.slice().sort((left, right) => left.locale.localeCompare(right.locale));
}

type CanonicalReleaseTarget = Readonly<Record<string, unknown>> & {
  readonly target: ReleaseTarget;
};
