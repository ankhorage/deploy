import { expect, test } from 'bun:test';

import type { AppStoreConnectRequest, AppStoreConnectTransport } from './AppStoreConnectTransport';
import { createAppStorePhasedRelease } from './createAppStorePhasedRelease';
import { createAppStoreReviewSubmission } from './createAppStoreReviewSubmission';
import { createAppStoreReviewSubmissionItem } from './createAppStoreReviewSubmissionItem';
import { createAppStoreVersionReleaseRequest } from './createAppStoreVersionReleaseRequest';
import { submitAppStoreReviewSubmission } from './submitAppStoreReviewSubmission';
import { syncAppStoreReleaseNotes } from './syncAppStoreReleaseNotes';

test('App Store release-note sync updates desired locales and preserves provider-only locales', async () => {
  const requests: AppStoreConnectRequest[] = [];
  const result = await syncAppStoreReleaseNotes({
    versionId: 'version-1',
    notes: [
      { locale: 'de-CH', text: 'Neu' },
      { locale: 'en-US', text: 'New' },
    ],
    token: 'TOKEN_SENTINEL',
    request: noteTransport(requests),
  });
  expect(result).toBe(true);
  const writes = requests.filter((request) => request.method !== 'GET');
  expect(writes.map((request) => request.method)).toEqual(['PATCH', 'POST']);
  expect(writes.some((request) => request.body?.includes('fr-FR'))).toBe(false);
  expect(JSON.stringify(writes.map((request) => request.body))).not.toContain('TOKEN_SENTINEL');
});

test('App Store review submission uses current review-submission resources', async () => {
  const requests: AppStoreConnectRequest[] = [];
  const request = successTransport(requests);
  const reviewSubmissionId = await createAppStoreReviewSubmission({
    appId: 'app-1',
    token: 'token',
    request,
  });
  expect(reviewSubmissionId).toBe('review-1');
  if (reviewSubmissionId === null) return;
  expect(
    await createAppStoreReviewSubmissionItem({
      reviewSubmissionId,
      versionId: 'version-1',
      token: 'token',
      request,
    }),
  ).toBe(true);
  expect(
    await submitAppStoreReviewSubmission({
      reviewSubmissionId,
      token: 'token',
      request,
    }),
  ).toBe(true);
  expect(requests.map((item) => `${item.method} ${item.url}`)).toEqual([
    'POST https://api.appstoreconnect.apple.com/v1/reviewSubmissions',
    'POST https://api.appstoreconnect.apple.com/v1/reviewSubmissionItems',
    'PATCH https://api.appstoreconnect.apple.com/v1/reviewSubmissions/review-1',
  ]);
  const itemBody = parseBody(requests[1]?.body);
  expect(itemBody).toEqual({
    data: {
      type: 'reviewSubmissionItems',
      relationships: {
        reviewSubmission: {
          data: { type: 'reviewSubmissions', id: 'review-1' },
        },
        appStoreVersion: {
          data: { type: 'appStoreVersions', id: 'version-1' },
        },
      },
    },
  });
});

test('App Store phased and manual release requests use separate resources', async () => {
  const requests: AppStoreConnectRequest[] = [];
  const request = successTransport(requests);
  expect(
    await createAppStorePhasedRelease({
      versionId: 'version-1',
      token: 'token',
      request,
    }),
  ).toBe(true);
  expect(
    await createAppStoreVersionReleaseRequest({
      versionId: 'version-1',
      token: 'token',
      request,
    }),
  ).toBe(true);
  expect(requests.map((item) => `${item.method} ${item.url}`)).toEqual([
    'POST https://api.appstoreconnect.apple.com/v1/appStoreVersionPhasedReleases',
    'POST https://api.appstoreconnect.apple.com/v1/appStoreVersionReleaseRequests',
  ]);
});

function noteTransport(requests: AppStoreConnectRequest[]): AppStoreConnectTransport {
  return (request) => {
    requests.push(request);
    if (request.method === 'GET') {
      return Promise.resolve(
        response(200, {
          data: [localization('de-1', 'de-CH', 'Alt'), localization('fr-1', 'fr-FR', 'Conserver')],
        }),
      );
    }
    return Promise.resolve(response(request.method === 'POST' ? 201 : 200, {}));
  };
}

function successTransport(requests: AppStoreConnectRequest[]): AppStoreConnectTransport {
  return (request) => {
    requests.push(request);
    if (request.url.endsWith('/reviewSubmissions') && request.method === 'POST') {
      return Promise.resolve(
        response(201, { data: { type: 'reviewSubmissions', id: 'review-1' } }),
      );
    }
    return Promise.resolve(response(request.method === 'POST' ? 201 : 200, {}));
  };
}

function localization(id: string, locale: string, whatsNew: string): unknown {
  return {
    type: 'appStoreVersionLocalizations',
    id,
    attributes: { locale, whatsNew },
  };
}

function parseBody(body: string | undefined): unknown {
  return body === undefined ? null : (JSON.parse(body) as unknown);
}

function response(status: number, body: unknown): { status: number; body: string } {
  return { status, body: JSON.stringify(body) };
}
