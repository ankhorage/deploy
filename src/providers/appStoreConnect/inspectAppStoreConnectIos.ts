import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { AppStoreConnectIosState } from './AppStoreConnectIosState';
import type { AppStoreConnectTokenFactory } from './AppStoreConnectTokenFactory';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreConnectAppsUrl, appStoreConnectVersionsUrl } from './appStoreConnectUrls';
import { resolveAppStoreConnectToken } from './resolveAppStoreConnectToken';

export type InspectAppStoreConnectIosResult =
  | { readonly status: 'completed'; readonly state: AppStoreConnectIosState }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };

export async function inspectAppStoreConnectIos(options: {
  readonly bundleIdentifier: string;
  readonly version: string;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: AppStoreConnectTokenFactory;
  readonly request: AppStoreConnectTransport;
  readonly now: Date;
}): Promise<InspectAppStoreConnectIosResult> {
  const access = await resolveAppStoreConnectToken(options);
  if (!access.ok) return { status: 'action-required', action: access.action };
  const app = await requestJson(
    options.request,
    appStoreConnectAppsUrl(options.bundleIdentifier),
    access.token,
  );
  if (!app.ok) return app.result;
  const appId = parseAppId(app.value, options.bundleIdentifier);
  if (appId === null) return appRequired();
  const versions = await requestJson(
    options.request,
    appStoreConnectVersionsUrl(appId),
    access.token,
  );
  if (!versions.ok) return versions.result;
  const version = parseVersionState(versions.value, options.version);
  if (version === undefined) return failure('APP_STORE_CONNECT_RESPONSE_INVALID');
  return {
    status: 'completed',
    state: { appId, bundleIdentifier: options.bundleIdentifier, version },
  };
}

type JsonRequestResult =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly result: InspectAppStoreConnectIosResult };

async function requestJson(
  request: AppStoreConnectTransport,
  url: string,
  token: string,
): Promise<JsonRequestResult> {
  const response = await request({ method: 'GET', url, token });
  if (response.status === 401) return { ok: false, result: authenticationRequired() };
  if (response.status === 403) return { ok: false, result: permissionRequired() };
  if (response.status < 200 || response.status >= 300) {
    return { ok: false, result: failure('APP_STORE_CONNECT_INSPECTION_FAILED') };
  }
  try {
    return { ok: true, value: JSON.parse(response.body) as unknown };
  } catch {
    return { ok: false, result: failure('APP_STORE_CONNECT_RESPONSE_INVALID') };
  }
}

function parseAppId(value: unknown, expectedBundleIdentifier: string): string | null {
  if (!isRecord(value) || !Array.isArray(value.data)) return null;
  const matches = value.data.filter((item) => {
    if (!isRecord(item) || item.type !== 'apps' || !isNonEmptyString(item.id)) return false;
    if (!isRecord(item.attributes)) return false;
    return item.attributes.bundleId === expectedBundleIdentifier;
  });
  if (matches.length !== 1) return null;
  return (matches[0] as { readonly id: string }).id;
}

function parseVersionState(
  value: unknown,
  expectedVersion: string,
): AppStoreConnectIosState['version'] | undefined {
  if (!isRecord(value) || !Array.isArray(value.data)) return undefined;
  const matches = value.data.filter((item) => isMatchingVersion(item, expectedVersion));
  if (matches.length === 0) return null;
  if (matches.length !== 1) return undefined;
  const item = matches[0];
  if (!isRecord(item) || !isNonEmptyString(item.id)) return undefined;
  const buildId = relationshipBuildId(item);
  const build = buildId === null ? null : findIncludedBuild(value.included, buildId);
  if (buildId !== null && build === null) return undefined;
  return { versionId: item.id, version: expectedVersion, build };
}

function isMatchingVersion(value: unknown, expectedVersion: string): boolean {
  if (!isRecord(value) || value.type !== 'appStoreVersions' || !isRecord(value.attributes)) {
    return false;
  }
  return value.attributes.platform === 'IOS' && value.attributes.versionString === expectedVersion;
}

function relationshipBuildId(value: Record<string, unknown>): string | null {
  if (!isRecord(value.relationships) || !isRecord(value.relationships.build)) return null;
  const data = value.relationships.build.data;
  if (data === null || data === undefined) return null;
  if (!isRecord(data) || data.type !== 'builds' || !isNonEmptyString(data.id)) return null;
  return data.id;
}

function findIncludedBuild(
  included: unknown,
  buildId: string,
): NonNullable<AppStoreConnectIosState['version']>['build'] {
  if (!Array.isArray(included)) return null;
  const item = included.find(
    (entry) => isRecord(entry) && entry.type === 'builds' && entry.id === buildId,
  );
  if (!isRecord(item) || !isRecord(item.attributes)) return null;
  if (!isNonEmptyString(item.attributes.version)) return null;
  return {
    buildId,
    buildNumber: item.attributes.version,
    ...(typeof item.attributes.processingState === 'string'
      ? { processingState: item.attributes.processingState }
      : {}),
  };
}

function authenticationRequired(): InspectAppStoreConnectIosResult {
  return {
    status: 'action-required',
    action: {
      type: 'authentication', provider: 'app-store-connect', target: 'ios',
      code: 'APP_STORE_CONNECT_AUTHENTICATION_REQUIRED',
      message: 'App Store Connect API-key authentication is required for iOS deployment.',
    },
  };
}

function permissionRequired(): InspectAppStoreConnectIosResult {
  return {
    status: 'action-required',
    action: {
      type: 'manual-action', target: 'ios', provider: 'app-store-connect',
      code: 'APP_STORE_CONNECT_PERMISSION_REQUIRED',
      message: 'The App Store Connect team API key needs permission for iOS deployment.',
    },
  };
}

function appRequired(): InspectAppStoreConnectIosResult {
  return {
    status: 'action-required',
    action: {
      type: 'manual-action', target: 'ios', provider: 'app-store-connect',
      code: 'APP_STORE_APP_REQUIRED',
      message: 'Create the matching app in App Store Connect before iOS deployment.',
    },
  };
}

function failure(code: string): InspectAppStoreConnectIosResult {
  return {
    status: 'failed',
    failure: {
      code, message: 'App Store Connect iOS state could not be inspected.',
      target: 'ios', provider: 'app-store-connect',
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
