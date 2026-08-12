import type { AndroidDeploymentPublication } from '../../domain/AndroidDeploymentPublication';
import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';
import type { GooglePlayTokenFactory } from './GooglePlayTokenFactory';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { inspectGooglePlayTrack } from './inspectGooglePlayTrack';

export type GooglePlayVerificationResult =
  | { readonly status: 'completed'; readonly verification: DeploymentVerificationResult }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction };

export async function verifyGooglePlayPublication(options: {
  readonly packageName: string;
  readonly publication: AndroidDeploymentPublication;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: GooglePlayTokenFactory;
  readonly request: GooglePlayTransport;
}): Promise<GooglePlayVerificationResult> {
  const inspected = await inspectGooglePlayTrack({
    packageName: options.packageName,
    track: options.publication.track,
    credentials: options.credentials,
    resolveSecret: options.resolveSecret,
    createToken: options.createToken,
    request: options.request,
  });
  if (inspected.status === 'action-required') return inspected;
  if (inspected.status === 'failed') return { status: 'completed', verification: failed() };
  const found = inspected.state.releases.some((release) =>
    release.versionCodes.includes(options.publication.versionCode),
  );
  return { status: 'completed', verification: found ? { ok: true } : failed() };
}

function failed(): DeploymentVerificationResult {
  return {
    ok: false,
    issues: [
      {
        code: 'GOOGLE_PLAY_VERSION_NOT_ACTIVE',
        message: 'The published Android version is not active on the requested Google Play track.',
        target: 'android',
        provider: 'google-play',
      },
    ],
  };
}
