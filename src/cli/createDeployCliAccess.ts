import type { DeploymentCredentialReference } from '../index.js';
import type { ProjectReleaseAccess } from '../project/index.js';
import { DEPLOY_CLI_ENVIRONMENT } from './DeployCliEnvironment.js';
import type { DeployCliOptions } from './DeployCliOptions.js';

export function createDeployCliAccess(
  options: DeployCliOptions,
  env: Readonly<Record<string, string | undefined>>,
): ProjectReleaseAccess {
  const credentials: DeploymentCredentialReference[] = [];
  const secrets = new Map<string, string>();
  addSecret(credentials, secrets, env, {
    envName: DEPLOY_CLI_ENVIRONMENT.googlePlayServiceAccountJson,
    id: 'env:google-play-service-account',
    provider: 'google-play',
    kind: 'service-account',
  });
  addSecret(credentials, secrets, env, {
    envName: DEPLOY_CLI_ENVIRONMENT.appStoreConnectApiKeyJson,
    id: 'env:app-store-connect-api-key',
    provider: 'app-store-connect',
    kind: 'api-key',
  });
  addSecret(credentials, secrets, env, {
    envName: DEPLOY_CLI_ENVIRONMENT.easToken,
    id: 'env:eas-token',
    provider: 'eas',
    kind: 'expo-token',
  });

  return {
    credentials,
    resolveSecret: (reference) => Promise.resolve(secrets.get(reference.id) ?? null),
    ...androidAccess(options),
    ...iosAccess(options),
    ...webAccess(options),
  };
}

interface SecretInput {
  readonly envName: string;
  readonly id: string;
  readonly provider: string;
  readonly kind: string;
}

function addSecret(
  credentials: DeploymentCredentialReference[],
  secrets: Map<string, string>,
  env: Readonly<Record<string, string | undefined>>,
  input: SecretInput,
): void {
  const value = env[input.envName]?.trim();
  if (value === undefined || value.length === 0) return;
  credentials.push({ id: input.id, provider: input.provider, kind: input.kind });
  secrets.set(input.id, value);
}

function androidAccess(options: DeployCliOptions): Pick<ProjectReleaseAccess, 'android'> {
  if (options.androidTrack === undefined) return {};
  return {
    android: {
      track: options.androidTrack,
      ...(options.androidBuildProfile === undefined
        ? {}
        : { buildProfile: options.androidBuildProfile }),
    },
  };
}

function iosAccess(options: DeployCliOptions): Pick<ProjectReleaseAccess, 'ios'> {
  return options.iosBuildProfile === undefined
    ? {}
    : { ios: { buildProfile: options.iosBuildProfile } };
}

function webAccess(options: DeployCliOptions): Pick<ProjectReleaseAccess, 'web'> {
  if (options.webAlias === undefined && options.webEnvironment === undefined) return {};
  return {
    web: {
      ...(options.webAlias === undefined ? {} : { alias: options.webAlias }),
      ...(options.webEnvironment === undefined ? {} : { environment: options.webEnvironment }),
    },
  };
}
