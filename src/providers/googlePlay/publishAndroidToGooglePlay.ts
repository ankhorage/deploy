import type { AndroidDeploymentIntent } from '../../domain/AndroidDeploymentIntent';
import type { AndroidDeploymentPublication } from '../../domain/AndroidDeploymentPublication';
import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { EasAndroidBuildArtifact } from '../eas/android/EasAndroidBuildArtifact';
import { commitGooglePlayEdit } from './commitGooglePlayEdit';
import type { AndroidArchiveDownloader } from './downloadAndroidArchive';
import { cleanupAndroidArchive } from './downloadAndroidArchive';
import type { GooglePlayTokenFactory } from './GooglePlayTokenFactory';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { insertGooglePlayEdit } from './insertGooglePlayEdit';
import { resolveGooglePlayAccessToken } from './resolveGooglePlayAccessToken';
import { updateGooglePlayTrack } from './updateGooglePlayTrack';
import { uploadGooglePlayBundle } from './uploadGooglePlayBundle';

export type GooglePlayPublishResult =
  | { readonly status: 'completed'; readonly publication: AndroidDeploymentPublication }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };

export async function publishAndroidToGooglePlay(options: {
  readonly packageName: string;
  readonly revision: string;
  readonly intent: AndroidDeploymentIntent;
  readonly build: EasAndroidBuildArtifact;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: GooglePlayTokenFactory;
  readonly request: GooglePlayTransport;
  readonly downloadArchive: AndroidArchiveDownloader;
}): Promise<GooglePlayPublishResult> {
  const access = await resolveGooglePlayAccessToken(options);
  if (!access.ok) return { status: 'action-required', action: access.action };
  const archive = await safeDownload(options.downloadArchive, options.build.archiveUrl);
  if (archive === null) return failure('ANDROID_ARCHIVE_DOWNLOAD_FAILED');
  try {
    return await publishArchive(options, access.token, archive.filePath);
  } finally {
    await cleanupAndroidArchive(archive.directory);
  }
}

async function publishArchive(
  options: Parameters<typeof publishAndroidToGooglePlay>[0],
  token: string,
  filePath: string,
): Promise<GooglePlayPublishResult> {
  const shared = { packageName: options.packageName, token, request: options.request };
  const editId = await insertGooglePlayEdit(shared);
  if (editId === null) return failure('GOOGLE_PLAY_EDIT_CREATE_FAILED');
  const versionCode = await uploadGooglePlayBundle({ ...shared, editId, filePath });
  if (versionCode !== options.build.versionCode) return failure('GOOGLE_PLAY_VERSION_MISMATCH');
  const updated = await updateGooglePlayTrack({
    ...shared,
    editId,
    ...options.intent,
    versionCode,
  });
  if (!updated) return failure('GOOGLE_PLAY_TRACK_UPDATE_FAILED');
  const committed = await commitGooglePlayEdit({ ...shared, editId });
  return committed ? completed(options) : failure('GOOGLE_PLAY_EDIT_COMMIT_FAILED');
}

function completed(
  options: Parameters<typeof publishAndroidToGooglePlay>[0],
): GooglePlayPublishResult {
  return {
    status: 'completed',
    publication: {
      target: 'android',
      revision: options.revision,
      buildProvider: 'eas',
      publishProvider: 'google-play',
      buildId: options.build.buildId,
      versionCode: options.build.versionCode,
      track: options.intent.track,
      releaseStatus: options.intent.releaseStatus,
    },
  };
}

async function safeDownload(
  download: AndroidArchiveDownloader,
  url: string,
): ReturnType<AndroidArchiveDownloader> {
  try {
    return await download(url);
  } catch {
    return null;
  }
}

function failure(code: string): GooglePlayPublishResult {
  return {
    status: 'failed',
    failure: {
      code,
      message: 'Google Play Android publication failed.',
      target: 'android',
      provider: 'google-play',
    },
  };
}
