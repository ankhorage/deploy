import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';
import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import type { ReleasePlanStep } from '../../domain/release/ReleasePlanStep';
import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import { commitGooglePlayEdit } from './commitGooglePlayEdit';
import type { GooglePlayTokenFactory } from './GooglePlayTokenFactory';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { insertGooglePlayEdit } from './insertGooglePlayEdit';
import { resolveGooglePlayAccessToken } from './resolveGooglePlayAccessToken';
import { updateGooglePlayReleaseInEdit } from './updateGooglePlayReleaseInEdit';

export async function executeGooglePlayReleaseMutation(options: {
  readonly step: ReleasePlanStep;
  readonly desired: ReleaseDesiredState;
  readonly packageName: string;
  readonly track: AndroidDeploymentTrack;
  readonly versionCode: string;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: GooglePlayTokenFactory;
  readonly request: GooglePlayTransport;
}): Promise<ReleaseMutationResult> {
  if (!isSupported(options.step)) return failed('GOOGLE_PLAY_RELEASE_STEP_UNSUPPORTED');
  const access = await resolveGooglePlayAccessToken(options);
  if (!access.ok) return blocked(access.action.code);
  const shared = {
    packageName: options.packageName,
    token: access.token,
    request: options.request,
  };
  const editId = await insertGooglePlayEdit(shared);
  if (editId === null) return failed('GOOGLE_PLAY_EDIT_CREATE_FAILED');
  const updated = await updateStep(options, access.token, editId);
  if (!updated) return failed('GOOGLE_PLAY_RELEASE_UPDATE_FAILED');
  const committed = await commitGooglePlayEdit({ ...shared, editId });
  return committed ? { status: 'completed' } : failed('GOOGLE_PLAY_EDIT_COMMIT_FAILED');
}

function updateStep(
  options: Parameters<typeof executeGooglePlayReleaseMutation>[0],
  token: string,
  editId: string,
): Promise<boolean> {
  const notes = options.step.operation === 'sync-notes' ? options.desired.notes : undefined;
  const rollout =
    options.step.operation === 'release' || options.step.operation === 'rollout'
      ? options.desired.rollout.android
      : undefined;
  return updateGooglePlayReleaseInEdit({
    packageName: options.packageName,
    editId,
    track: options.track,
    targetVersionCode: options.versionCode,
    ...(notes === undefined ? {} : { releaseNotes: notes }),
    ...(rollout === undefined ? {} : { rollout }),
    token,
    request: options.request,
  });
}

function isSupported(step: ReleasePlanStep): boolean {
  return (
    step.target === 'android' &&
    (step.operation === 'sync-notes' ||
      step.operation === 'release' ||
      step.operation === 'rollout')
  );
}

function blocked(code: string): ReleaseMutationResult {
  return { status: 'blocked', code };
}

function failed(code: string): ReleaseMutationResult {
  return { status: 'failed', code };
}
