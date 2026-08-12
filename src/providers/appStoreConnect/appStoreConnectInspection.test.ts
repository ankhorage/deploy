import { expect, test } from 'bun:test';

import type { AppStoreConnectRequest } from './AppStoreConnectTransport';
import { inspectAppStoreConnectIos } from './inspectAppStoreConnectIos';
import { resolveAppStoreConnectToken } from './resolveAppStoreConnectToken';

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
          data: [{
            type: 'appStoreVersions', id: 'version-id',
            attributes: { platform: 'IOS', versionString: '1.2.3' },
            relationships: { build: { data: { type: 'builds', id: 'build-id' } } },
          }],
          included: [{
            type: 'builds', id: 'build-id',
            attributes: { version: '42', processingState: 'VALID' },
          }],
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
    bundleIdentifier: 'com.example.app', version: '1.2.3',
    request: () => Promise.resolve({ status: 200, body: JSON.stringify({ data: [] }) }),
    ...ACCESS,
  });
  expect(result.status).toBe('action-required');
  if (result.status === 'action-required') expect(result.action.code).toBe('APP_STORE_APP_REQUIRED');
});

test('App Store Connect 401 and 403 are normalized without body leakage', async () => {
  for (const status of [401, 403]) {
    const result = await inspectAppStoreConnectIos({
      bundleIdentifier: 'com.example.app', version: '1.2.3',
      request: () => Promise.resolve({ status, body: PRIVATE_KEY }),
      ...ACCESS,
    });
    expect(result.status).toBe('action-required');
    expect(JSON.stringify(result)).not.toContain(PRIVATE_KEY);
  }
});
