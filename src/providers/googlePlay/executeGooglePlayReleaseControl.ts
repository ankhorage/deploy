import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';
import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { ReleaseLifecycleControl } from '../../domain/release/ReleaseLifecycleControl';
import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import { commitGooglePlayEdit } from './commitGooglePlayEdit';
import type { GooglePlayTokenFactory } from './GooglePlayTokenFactory';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { insertGooglePlayEdit } from './insertGooglePlayEdit';
import { resolveGooglePlayAccessToken } from './resolveGooglePlayAccessToken';
import { updateGooglePlayReleaseControlInEdit } from './updateGooglePlayReleaseControlInEdit';

type AndroidControl = Extract<ReleaseLifecycleControl, { target: 'android' }>;

export async function executeGooglePlayReleaseControl(options: {
  readonly control: AndroidControl;
  readonly packageName: string;
  readonly track: AndroidDeploymentTrack;
  readonly versionCode: string;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: GooglePlayTokenFactory;
  readonly request: GooglePlayTransport;
}): Promise<ReleaseMutationResult> {
  const access = await resolveGooglePlayAccessToken(options);
  if (!access.ok) return { status: 'blocked', code: access.action.code };
  const shared = {
    packageName: options.packageName,
    token: access.token,
    request: options.request,
  };
  const editId = await insertGooglePlayEdit(shared);
  if (editId === null) return failed('GOOGLE_PLAY_CONTROL_EDIT_CREATE_FAILED');
  const updated = await updateGooglePlayReleaseControlInEdit({
    packageName: options.packageName,
    editId,
    track: options.track,
    targetVersionCode: options.versionCode,
    control: options.control,
    token: access.token,
    request: options.request,
  });
  if (!updated) return failed('GOOGLE_PLAY_RELEASE_CONTROL_FAILED');
  const committed = await commitGooglePlayEdit({ ...shared, editId });
  return committed ? { status: 'completed' } : failed('GOOGLE_PLAY_CONTROL_COMMIT_FAILED');
}

function failed(code: string): ReleaseMutationResult {
  return { status: 'failed', code };
}
