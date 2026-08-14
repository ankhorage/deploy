import type { ReleaseNote } from '../../domain/release/ReleaseNote';
import type { ReleaseTargetRollout } from '../../domain/release/ReleaseTargetRollout';
import type { GooglePlayEditableRelease } from './GooglePlayEditableRelease';
import type { GooglePlayEditableTrack } from './GooglePlayEditableTrack';
import { mergeGooglePlayReleaseNotes } from './mergeGooglePlayReleaseNotes';

export function createGooglePlayTrackUpdateBody(options: {
  readonly current: GooglePlayEditableTrack;
  readonly targetVersionCode: string;
  readonly releaseNotes?: readonly ReleaseNote[];
  readonly rollout?: ReleaseTargetRollout;
}): Readonly<Record<string, unknown>> | null {
  const matches = options.current.releases.filter((release) =>
    release.versionCodes.includes(options.targetVersionCode),
  );
  if (matches.length !== 1) return null;
  const [target] = matches;
  if (target === undefined) return null;
  const releases = options.current.releases.map((release) =>
    release === target ? createTargetRelease(target, options) : release.raw,
  );
  return { track: options.current.track, releases };
}

function createTargetRelease(
  current: GooglePlayEditableRelease,
  options: Parameters<typeof createGooglePlayTrackUpdateBody>[0],
): Readonly<Record<string, unknown>> {
  const {
    versionCodes: _versionCodes,
    releaseNotes: _releaseNotes,
    status: _status,
    userFraction: _userFraction,
    ...preserved
  } = current.raw;
  const base = {
    ...preserved,
    versionCodes: current.versionCodes,
    releaseNotes: desiredNotes(current, options.releaseNotes),
    status: desiredStatus(current, options.rollout),
  };
  return withFraction(base, current, options.rollout);
}

function desiredNotes(
  current: GooglePlayEditableRelease,
  releaseNotes: readonly ReleaseNote[] | undefined,
): unknown {
  return releaseNotes === undefined
    ? current.raw.releaseNotes
    : mergeGooglePlayReleaseNotes(releaseNotes, current.releaseNotes);
}

function desiredStatus(
  current: GooglePlayEditableRelease,
  rollout: ReleaseTargetRollout | undefined,
): GooglePlayEditableRelease['status'] {
  if (rollout === undefined) return current.status;
  return rollout.mode === 'staged' ? 'inProgress' : 'completed';
}

function withFraction(
  base: Readonly<Record<string, unknown>>,
  current: GooglePlayEditableRelease,
  rollout: ReleaseTargetRollout | undefined,
): Readonly<Record<string, unknown>> {
  if (rollout === undefined) {
    return current.userFraction === undefined
      ? base
      : { ...base, userFraction: Number(current.userFraction) };
  }
  if (rollout.mode !== 'staged') return base;
  const userFraction = toProviderFraction(rollout.initialFraction);
  return userFraction === null ? base : { ...base, userFraction };
}

function toProviderFraction(value: string | undefined): number | null {
  if (value === undefined || !/^0\.\d+$/.test(value)) return null;
  const fraction = Number(value);
  return Number.isFinite(fraction) && fraction > 0 && fraction < 1 ? fraction : null;
}
