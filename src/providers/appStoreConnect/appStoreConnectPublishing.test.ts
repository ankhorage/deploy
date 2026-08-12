import { expect, test } from 'bun:test';

import type { AppStoreConnectRequest } from './AppStoreConnectTransport';
import type { AppStoreUploadRequest } from './AppStoreUploadTransport';
import { parseBuildUploadFileReservation } from './parseBuildUploadFileReservation';
import { publishIosToAppStoreConnect } from './publishIosToAppStoreConnect';
import { verifyAppStoreConnectPublication } from './verifyAppStoreConnectPublication';

const TOKEN = 'JWT_SENTINEL';
const CREDENTIAL = { provider: 'app-store-connect', id: 'delivery', kind: 'api-key' } as const;
const ACCESS = {
  credentials: [CREDENTIAL],
  resolveSecret: () => Promise.resolve(JSON.stringify({ keyId: 'key', issuerId: 'issuer', privateKey: 'pk' })),
  createToken: () => Promise.resolve(TOKEN),
  now: new Date('2026-08-12T20:00:00Z'),
} as const;

function reservation(fileSize: number) {
  return {
    data: {
      type: 'buildUploadFiles',
      id: 'file-id',
      attributes: {
        uti: 'com.apple.ipa',
        uploadOperations: [{
          offset: 0,
          length: fileSize,
          method: 'PUT',
          url: 'https://upload.example.test/part',
          requestHeaders: [{ name: 'x-test', value: 'yes' }],
        }],
      },
    },
  };
}

test('build upload reservation rejects gaps and out of bounds chunks', () => {
  const value = reservation(4);
  value.data.attributes.uploadOperations[0] = {
    offset: 1,
    length: 3,
    method: 'PUT',
    url: 'https://upload.example.test/part',
    requestHeaders: [],
  };
  expect(parseBuildUploadFileReservation(value, 4)).toBeNull();
});

test('App Store publication uploads and attaches without review submission', async () => {
  const apiRequests: AppStoreConnectRequest[] = [];
  const uploadRequests: AppStoreUploadRequest[] = [];
  const file = Buffer.from('test');
  const request = (input: AppStoreConnectRequest) => {
    apiRequests.push(input);
    const index = apiRequests.length;
    if (index === 1) return Promise.resolve({ status: 201, body: JSON.stringify({ data: { type: 'buildUploads', id: 'upload-id' } }) });
    if (index === 2) return Promise.resolve({ status: 201, body: JSON.stringify(reservation(file.length)) });
    if (index === 3) return Promise.resolve({ status: 200, body: '{}' });
    if (index === 4) return Promise.resolve({
      status: 200,
      body: JSON.stringify({
        data: { type: 'buildUploads', id: 'upload-id', attributes: { state: { state: 'COMPLETE' } } },
        included: [{ type: 'builds', id: 'build-id', attributes: { version: '42', processingState: 'VALID' } }],
      }),
    });
    if (index === 5) return Promise.resolve({ status: 200, body: JSON.stringify({ data: [] }) });
    if (index === 6) return Promise.resolve({
      status: 201,
      body: JSON.stringify({ data: { type: 'appStoreVersions', id: 'version-id', attributes: { platform: 'IOS', versionString: '1.2.3' } } }),
    });
    return Promise.resolve({ status: 204, body: '' });
  };
  const result = await publishIosToAppStoreConnect({
    appId: 'app-id',
    version: '1.2.3',
    buildNumber: '42',
    file,
    request,
    upload: (input) => {
      uploadRequests.push(input);
      return Promise.resolve({ status: 200 });
    },
    wait: () => Promise.resolve(),
    maxAttempts: 2,
    ...ACCESS,
  });
  expect(result.status).toBe('completed');
  expect(uploadRequests).toHaveLength(1);
  expect(uploadRequests[0]?.headers).toEqual([{ name: 'x-test', value: 'yes' }]);
  expect(apiRequests.every((input) => input.token === TOKEN)).toBe(true);
  expect(JSON.stringify(result)).not.toContain(TOKEN);
});

test('App Store verification reads back the attached processed build', async () => {
  const result = await verifyAppStoreConnectPublication({
    publication: {
      buildId: 'build-id',
      versionId: 'version-id',
      buildNumber: '42',
      version: '1.2.3',
    },
    request: () => Promise.resolve({
      status: 200,
      body: JSON.stringify({
        data: {
          type: 'builds',
          id: 'build-id',
          attributes: { version: '42', processingState: 'VALID' },
        },
      }),
    }),
    ...ACCESS,
  });
  expect(result).toEqual({ status: 'completed', verification: { ok: true } });
});
