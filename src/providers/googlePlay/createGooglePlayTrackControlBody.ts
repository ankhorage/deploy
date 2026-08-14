import type { ReleaseLifecycleControl } from '../../domain/release/ReleaseLifecycleControl';
import type { GooglePlayEditableRelease } from './GooglePlayEditableRelease';
import type { GooglePlayEditableTrack } from './GooglePlayEditableTrack';

type AndroidControl = Extract<ReleaseLifecycleControl, { target: 'android' }>;

export function createGooglePlayTrackControlBody(options: {
  readonly current: GooglePlayEditableTrack;
  readonly targetVersionCode: string;
  readonly control: AndroidControl;
}): Readonly<Record<string, unknown>> | null {
  const matches = options.current.releases.filter((release) =>
    release.versionCodes.includes(options.targetVersionCode),
  );
  if (matches.length !== 1) return null;
  const [target] = matches;
  if (target === undefined || !canTransition(target, options.control)) return null;
  const releases = options.current.releases.map((release) =>
    release === target ? controlledRelease(target, options.control) : release.raw,
  );
  return { track: options.current.track, releases };
}

function canTransition(release: GooglePlayEditableRelease, control: AndroidControl): boolean {
  if (release.userFraction === undefined) return false;
  return control.action === 'halt' ? release.status === 'inProgress' : release.status === 'halted';
}

function controlledRelease(
  current: GooglePlayEditableRelease,
  control: AndroidControl,
): Readonly<Record<string, unknown>> {
  const { status: _status, userFraction: _userFraction, ...preserved } = current.raw;
  return {
    ...preserved,
    status: control.action === 'halt' ? 'halted' : 'inProgress',
    userFraction: Number(current.userFraction),
  };
}
