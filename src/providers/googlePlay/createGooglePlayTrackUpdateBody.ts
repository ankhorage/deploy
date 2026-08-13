import type { ReleaseNote } from '../../domain/release/ReleaseNote';
import type { ReleaseTargetRollout } from '../../domain/release/ReleaseTargetRollout';
import type { GooglePlayEditableRelease } from './GooglePlayEditableRelease';
import type { GooglePlayEditableTrack } from './GooglePlayEditableTrack';
import { mergeGooglePlayReleaseNotes } from './mergeGooglePlayReleaseNotes';

export function createGooglePlayTrackUpdateBody(options: {
  readonly current: GooglePlayEditableTrack;
  readonly targetVersionCode: string;
  readonly releaseNotes: readonly ReleaseNote[];
  readonly rollout: ReleaseTargetRollout;
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
    releaseNotes: mergeGooglePlayReleaseNotes(options.releaseNotes, current.releaseNotes),
    status: options.rollout.mode === 'staged' ? 'inProgress' : 'completed',
  };
  if (options.rollout.mode !== 'staged') return base;
  const userFraction = toProviderFraction(options.rollout.initialFraction);
  return userFraction === null ? base : { ...base, userFraction };
}

function toProviderFraction(value: string | undefined): number | null {
  if (value === undefined || !/^0\.\d+$/.test(value)) return null;
  const fraction = Number(value);
  return Number.isFinite(fraction) && fraction > 0 && fraction < 1 ? fraction : null;
}
