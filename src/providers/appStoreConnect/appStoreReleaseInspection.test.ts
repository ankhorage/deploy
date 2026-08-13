import { expect, test } from 'bun:test';

import type { AppStoreConnectRequest, AppStoreConnectTransport } from './AppStoreConnectTransport';
import { inspectAppStoreReleaseState } from './inspectAppStoreReleaseState';

const ACCESS = {
  bundleIdentifier: 'com.example.app',
  version: '2.1.0',
  credentials: [{ provider: 'app-store-connect', id: 'apple', kind: 'api-key' }],
  resolveSecret: () =>
    Promise.resolve(
      JSON.stringify({
        keyId: 'KEY',
        issuerId: 'ISSUER',
        privateKey: 'PRIVATE_KEY_SENTINEL',
      }),
    ),
  createToken: () => Promise.resolve('apple-token'),
  now: new Date('2026-08-13T12:00:00Z'),
};

test('App Store release inspection normalizes notes, review and phased release', async () => {
  const requests: AppStoreConnectRequest[] = [];
  const result = await inspectAppStoreReleaseState({
    ...ACCESS,
    request: createTransport(requests),
  });
  expect(result.status).toBe('completed');
  if (result.status !== 'completed') return;
  expect(result.state.appVersionState).toBe('WAITING_FOR_REVIEW');
  expect(result.state.releaseNotes).toEqual([{ locale: 'de-CH', text: 'Neu' }]);
  expect(result.state.reviewSubmission).toEqual({
    id: 'review-1',
    state: 'WAITING_FOR_REVIEW',
    submittedDate: '2026-08-13T10:00:00Z',
  });
  expect(result.state.phasedRelease).toEqual({
    id: 'phase-1',
    state: 'ACTIVE',
    currentDayNumber: 3,
  });
  expect(requests.every((request) => request.method === 'GET')).toBe(true);
  expect(JSON.stringify(result)).not.toContain('PRIVATE_KEY_SENTINEL');
});

test('App Store release inspection stops safely when the version does not exist', async () => {
  const requests: AppStoreConnectRequest[] = [];
  const result = await inspectAppStoreReleaseState({
    ...ACCESS,
    request: createMissingVersionTransport(requests),
  });
  expect(result.status).toBe('completed');
  if (result.status !== 'completed') return;
  expect(result.state.versionId).toBeNull();
  expect(result.state.reviewSubmission).toBeNull();
  expect(result.state.phasedRelease).toBeNull();
  expect(requests).toHaveLength(2);
});

function createTransport(requests: AppStoreConnectRequest[]): AppStoreConnectTransport {
  return (request) => {
    requests.push(request);
    return Promise.resolve(appStoreResponse(request));
  };
}

function createMissingVersionTransport(
  requests: AppStoreConnectRequest[],
): AppStoreConnectTransport {
  return (request) => {
    requests.push(request);
    if (request.url.includes('/apps?')) return Promise.resolve(appResponse());
    return Promise.resolve(response(200, { data: [] }));
  };
}

function appStoreResponse(request: AppStoreConnectRequest): { status: number; body: string } {
  if (request.url.includes('/apps?')) return appResponse();
  if (request.url.includes('/appStoreVersions?')) return versionResponse();
  if (request.url.includes('/appStoreVersionLocalizations?')) {
    return response(200, {
      data: [
        {
          type: 'appStoreVersionLocalizations',
          id: 'loc-1',
          attributes: { locale: 'de-ch', whatsNew: 'Neu' },
        },
      ],
    });
  }
  if (request.url.includes('/reviewSubmissions?')) return reviewResponse();
  if (request.url.includes('/appStoreVersionPhasedRelease?')) return phasedResponse();
  return response(404, {});
}

function appResponse(): { status: number; body: string } {
  return response(200, {
    data: [
      {
        type: 'apps',
        id: 'app-1',
        attributes: { bundleId: 'com.example.app' },
      },
    ],
  });
}

function versionResponse(): { status: number; body: string } {
  return response(200, {
    data: [
      {
        type: 'appStoreVersions',
        id: 'version-1',
        attributes: {
          platform: 'IOS',
          versionString: '2.1.0',
          appVersionState: 'WAITING_FOR_REVIEW',
          releaseType: 'MANUAL',
        },
      },
    ],
  });
}

function reviewResponse(): { status: number; body: string } {
  return response(200, {
    data: [
      {
        type: 'reviewSubmissions',
        id: 'review-1',
        attributes: {
          state: 'WAITING_FOR_REVIEW',
          submittedDate: '2026-08-13T10:00:00Z',
        },
        relationships: {
          appStoreVersionForReview: {
            data: { type: 'appStoreVersions', id: 'version-1' },
          },
        },
      },
    ],
  });
}

function phasedResponse(): { status: number; body: string } {
  return response(200, {
    data: {
      type: 'appStoreVersionPhasedReleases',
      id: 'phase-1',
      attributes: { phasedReleaseState: 'ACTIVE', currentDayNumber: 3 },
    },
  });
}

function response(status: number, body: unknown): { status: number; body: string } {
  return { status, body: JSON.stringify(body) };
}
