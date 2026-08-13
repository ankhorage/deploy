import { expect, test } from 'bun:test';

import type { StoreListingDesiredState } from '../../domain/storeListing/StoreListingDesiredState';
import type { AppStoreConnectRequest } from './AppStoreConnectTransport';
import { createAppStoreListingDiagnostics } from './createAppStoreListingDiagnostics';
import { inspectAppStoreConnectIos } from './inspectAppStoreConnectIos';
import { resolveAppStoreConnectToken } from './resolveAppStoreConnectToken';
import { resolveAppStoreListingContext } from './resolveAppStoreListingContext';
import { toAppStoreCurrentLocales } from './toAppStoreCurrentLocales';

const PRIVATE_KEY = 'PRIVATE_KEY_SENTINEL';
const TOKEN = 'JWT_SENTINEL';
const CREDENTIAL = { provider: 'app-store-connect', id: 'delivery', kind: 'api-key' } as const;
const SECRET = JSON.stringify({ keyId: 'KEY123', issuerId: 'issuer', privateKey: PRIVATE_KEY });
const NOW = new Date('2026-08-12T20:00:00Z');

const ACCESS = {
  credentials: [CREDENTIAL],
  resolveSecret: () => Promise.resolve(SECRET),
  createToken: () => Promise.resolve(TOKEN),
  now: NOW,
} as const;

test('App Store Connect token parsing stays secret and typed', async () => {
  let receivedPrivateKey = '';
  const result = await resolveAppStoreConnectToken({
    credentials: [CREDENTIAL],
    resolveSecret: () => Promise.resolve(SECRET),
    createToken: (credentials) => {
      receivedPrivateKey = credentials.privateKey;
      return Promise.resolve(TOKEN);
    },
    now: NOW,
  });
  expect(result).toEqual({ ok: true, token: TOKEN });
  expect(receivedPrivateKey).toBe(PRIVATE_KEY);
  expect(JSON.stringify(result)).not.toContain(PRIVATE_KEY);
});

test('App Store Connect inspection resolves exact app version and attached build', async () => {
  const requests: AppStoreConnectRequest[] = [];
  const result = await inspectAppStoreConnectIos({
    bundleIdentifier: 'com.example.app',
    version: '1.2.3',
    request: (request) => {
      requests.push(request);
      if (requests.length === 1) {
        return Promise.resolve({
          status: 200,
          body: JSON.stringify({
            data: [{ type: 'apps', id: 'app-id', attributes: { bundleId: 'com.example.app' } }],
          }),
        });
      }
      return Promise.resolve({
        status: 200,
        body: JSON.stringify({
          data: [
            {
              type: 'appStoreVersions',
              id: 'version-id',
              attributes: { platform: 'IOS', versionString: '1.2.3' },
              relationships: { build: { data: { type: 'builds', id: 'build-id' } } },
            },
          ],
          included: [
            {
              type: 'builds',
              id: 'build-id',
              attributes: { version: '42', processingState: 'VALID' },
            },
          ],
        }),
      });
    },
    ...ACCESS,
  });
  expect(result.status).toBe('completed');
  if (result.status === 'completed') expect(result.state.version?.build?.buildNumber).toBe('42');
  expect(requests.every((request) => request.token === TOKEN)).toBe(true);
  expect(JSON.stringify(result)).not.toContain(TOKEN);
});

test('App Store Connect absent app is a typed manual action', async () => {
  const result = await inspectAppStoreConnectIos({
    bundleIdentifier: 'com.example.app',
    version: '1.2.3',
    request: () => Promise.resolve({ status: 200, body: JSON.stringify({ data: [] }) }),
    ...ACCESS,
  });
  expect(result.status).toBe('action-required');
  if (result.status === 'action-required')
    expect(result.action.code).toBe('APP_STORE_APP_REQUIRED');
});

test('App Store Connect 401 and 403 are normalized without body leakage', async () => {
  for (const status of [401, 403]) {
    const result = await inspectAppStoreConnectIos({
      bundleIdentifier: 'com.example.app',
      version: '1.2.3',
      request: () => Promise.resolve({ status, body: PRIVATE_KEY }),
      ...ACCESS,
    });
    expect(result.status).toBe('action-required');
    expect(JSON.stringify(result)).not.toContain(PRIVATE_KEY);
  }
});

const STORE_LISTING_DESIRED: StoreListingDesiredState = {
  revision: 'listing-revision',
  locales: [{ locale: 'de-CH', name: 'Ankh' }],
  assetSets: [],
};

test('App Store listing context merges both localization layers into canonical state', async () => {
  const result = await resolveAppStoreListingContext({
    bundleIdentifier: 'com.example.app',
    desired: STORE_LISTING_DESIRED,
    token: TOKEN,
    request: (request) => Promise.resolve(appStoreListingResponse(request.url)),
  });

  expect(result.status).toBe('completed');
  if (result.status !== 'completed') return;
  const current = toAppStoreCurrentLocales(result.context);
  expect(current[0]?.locale).toBe('de-CH');
  expect(current[0]?.name).toBe('Ankh');
  expect(current[0]?.description).toBe('Beschreibung');
  expect(current[0]?.keywords).toEqual(['one', 'two']);
});

test('App Store listing diagnostics expose unsupported fields and screenshot variants', () => {
  const diagnostics = createAppStoreListingDiagnostics({
    revision: 'diagnostics',
    locales: [
      {
        locale: 'de-CH',
        name: 'Ankh',
        promoVideoUrl: 'https://example.test/video',
      },
    ],
    assetSets: [{ target: 'ios', locale: 'de-CH', variant: 'UNKNOWN', assets: [] }],
  });
  expect(diagnostics.map((item) => item.code)).toContain('APP_STORE_LISTING_FIELD_UNSUPPORTED');
  expect(diagnostics.map((item) => item.code)).toContain(
    'APP_STORE_SCREENSHOT_VARIANT_UNSUPPORTED',
  );
});

function appStoreListingResponse(url: string): { status: number; body: string } {
  if (url.includes('/apps?')) {
    return response([{ type: 'apps', id: 'app-id', attributes: { bundleId: 'com.example.app' } }]);
  }
  if (url.includes('/apps/app-id/appInfos?')) {
    return response([
      { type: 'appInfos', id: 'info-id', attributes: { state: 'PREPARE_FOR_SUBMISSION' } },
    ]);
  }
  if (url.includes('/apps/app-id/appStoreVersions?')) {
    return response([
      {
        type: 'appStoreVersions',
        id: 'version-id',
        attributes: { appVersionState: 'PREPARE_FOR_SUBMISSION' },
      },
    ]);
  }
  if (url.includes('/appInfos/info-id/appInfoLocalizations?')) {
    return response([
      {
        type: 'appInfoLocalizations',
        id: 'info-loc',
        attributes: { locale: 'de-DE', name: 'Ankh', subtitle: 'Kurz' },
      },
    ]);
  }
  if (url.includes('/appStoreVersions/version-id/appStoreVersionLocalizations?')) {
    return response([
      {
        type: 'appStoreVersionLocalizations',
        id: 'version-loc',
        attributes: {
          locale: 'de-DE',
          description: 'Beschreibung',
          keywords: 'one,two',
        },
      },
    ]);
  }
  return { status: 404, body: '{}' };
}

function response(data: readonly unknown[]): { status: number; body: string } {
  return { status: 200, body: JSON.stringify({ data }) };
}
