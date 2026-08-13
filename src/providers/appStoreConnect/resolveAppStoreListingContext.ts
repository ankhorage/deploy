import type { StoreListingDesiredState } from '../../domain/storeListing/StoreListingDesiredState';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreConnectAppsUrl } from './appStoreConnectUrls';
import type { AppStoreListingContextResult } from './AppStoreListingContextResult';
import {
  appInfoLocalizationsUrl,
  appStoreAppInfosUrl,
  appStoreVersionsForListingUrl,
  versionLocalizationsUrl,
} from './appStoreListingUrls';
import { parseAppStoreAppId } from './parseAppStoreAppId';
import { parseAppStoreListingLocalizations } from './parseAppStoreListingLocalizations';
import { parseEditableAppStoreResourceId } from './parseEditableAppStoreResourceId';
import { readAppStoreJson } from './readAppStoreJson';

export async function resolveAppStoreListingContext(options: {
  readonly bundleIdentifier: string;
  readonly desired: StoreListingDesiredState;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<AppStoreListingContextResult> {
  const appId = await resolveAppId(options);
  if (appId === undefined) return failed();
  if (appId === null) return appRequired();
  const containers = await resolveContainers({ ...options, appId });
  if (containers === undefined) return failed();
  if (containers === null) return editableContainerRequired();
  return resolveLocalizations({ ...options, appId, ...containers });
}

async function resolveAppId(
  options: Parameters<typeof resolveAppStoreListingContext>[0],
): Promise<string | null | undefined> {
  const value = await readAppStoreJson({
    ...options,
    url: appStoreConnectAppsUrl(options.bundleIdentifier),
  });
  if (value === null) return undefined;
  return parseAppStoreAppId(value, options.bundleIdentifier);
}

async function resolveContainers(options: {
  readonly appId: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<{ appInfoId: string; versionId: string } | null | undefined> {
  const [appInfos, versions] = await Promise.all([
    readAppStoreJson({ ...options, url: appStoreAppInfosUrl(options.appId) }),
    readAppStoreJson({ ...options, url: appStoreVersionsForListingUrl(options.appId) }),
  ]);
  if (appInfos === null || versions === null) return undefined;
  const appInfoId = parseEditableAppStoreResourceId(appInfos, 'appInfos');
  const versionId = parseEditableAppStoreResourceId(versions, 'appStoreVersions');
  if (appInfoId === undefined || versionId === undefined) return undefined;
  if (appInfoId === null || versionId === null) return null;
  return { appInfoId, versionId };
}

async function resolveLocalizations(options: {
  readonly appId: string;
  readonly appInfoId: string;
  readonly versionId: string;
  readonly desired: StoreListingDesiredState;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<AppStoreListingContextResult> {
  const [appInfo, version] = await Promise.all([
    readAppStoreJson({ ...options, url: appInfoLocalizationsUrl(options.appInfoId) }),
    readAppStoreJson({ ...options, url: versionLocalizationsUrl(options.versionId) }),
  ]);
  if (appInfo === null || version === null) return failed();
  const locales = parseAppStoreListingLocalizations({
    appInfo,
    version,
    desired: options.desired,
  });
  if (locales === null) return failed();
  return {
    status: 'completed',
    context: {
      appId: options.appId,
      appInfoId: options.appInfoId,
      versionId: options.versionId,
      locales,
    },
  };
}

function appRequired(): AppStoreListingContextResult {
  return {
    status: 'action-required',
    action: {
      type: 'manual-action',
      target: 'ios',
      provider: 'app-store-connect',
      code: 'APP_STORE_APP_REQUIRED',
      message: 'Create the matching app in App Store Connect before listing synchronization.',
    },
  };
}

function editableContainerRequired(): AppStoreListingContextResult {
  return {
    status: 'action-required',
    action: {
      type: 'manual-action',
      target: 'ios',
      provider: 'app-store-connect',
      code: 'APP_STORE_EDITABLE_LISTING_REQUIRED',
      message: 'An editable iOS App Store version is required for listing synchronization.',
    },
  };
}

function failed(): AppStoreListingContextResult {
  return {
    status: 'failed',
    failure: {
      code: 'APP_STORE_LISTING_CONTEXT_FAILED',
      message: 'App Store Connect listing containers could not be resolved.',
      target: 'ios',
      provider: 'app-store-connect',
    },
  };
}
