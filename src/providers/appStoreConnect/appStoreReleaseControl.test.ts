import { expect, test } from 'bun:test';

import type { AppStoreConnectRequest, AppStoreConnectTransport } from './AppStoreConnectTransport';
import type { AppStoreReleaseSnapshot } from './AppStoreReleaseSnapshot';
import { executeAppStoreReleaseControl } from './executeAppStoreReleaseControl';

test('App Store pause and resume use phased-release state PATCH', async () => {
  const pause = await execute('pause-phased', snapshot('ACTIVE', null));
  expect(pause.result.status).toBe('completed');
  expect(lastBody(pause.requests)).toEqual(phasedBody('phase-1', 'PAUSED'));

  const resume = await execute('resume-phased', snapshot('PAUSED', null));
  expect(resume.result.status).toBe('completed');
  expect(lastBody(resume.requests)).toEqual(phasedBody('phase-1', 'ACTIVE'));
});

test('App Store cancellation uses only supported provider resources', async () => {
  const phased = await execute('cancel-phased', snapshot('INACTIVE', null));
  expect(lastRequest(phased.requests)).toEqual({
    method: 'DELETE',
    url: 'https://api.appstoreconnect.apple.com/v1/appStoreVersionPhasedReleases/phase-1',
  });

  const review = await execute('cancel-review', snapshot(null, 'IN_REVIEW'));
  expect(lastBody(review.requests)).toEqual({
    data: {
      type: 'reviewSubmissions',
      id: 'review-1',
      attributes: { canceled: true },
    },
  });
});

async function execute(
  action: 'pause-phased' | 'resume-phased' | 'cancel-phased' | 'cancel-review',
  releaseSnapshot: AppStoreReleaseSnapshot,
) {
  const requests: AppStoreConnectRequest[] = [];
  const result = await executeAppStoreReleaseControl({
    control: { target: 'ios', action },
    snapshot: releaseSnapshot,
    credentials: [{ provider: 'app-store-connect', id: 'apple', kind: 'api-key' }],
    resolveSecret: () =>
      Promise.resolve(JSON.stringify({ keyId: 'KEY', issuerId: 'ISSUER', privateKey: 'PRIVATE' })),
    createToken: () => Promise.resolve('token'),
    request: transport(requests),
    now: new Date('2026-08-14T00:00:00Z'),
  });
  return { result, requests };
}

function snapshot(
  phasedState: 'INACTIVE' | 'ACTIVE' | 'PAUSED' | null,
  reviewState: string | null,
): AppStoreReleaseSnapshot {
  return {
    appId: 'app-1',
    version: '2.1.0',
    versionId: 'version-1',
    releaseNotes: [],
    reviewSubmission: reviewState === null ? null : { id: 'review-1', state: reviewState },
    phasedRelease: phasedState === null ? null : { id: 'phase-1', state: phasedState },
  };
}

function phasedBody(id: string, state: 'ACTIVE' | 'PAUSED'): unknown {
  return {
    data: {
      type: 'appStoreVersionPhasedReleases',
      id,
      attributes: { phasedReleaseState: state },
    },
  };
}

function lastRequest(
  requests: readonly AppStoreConnectRequest[],
): Pick<AppStoreConnectRequest, 'method' | 'url'> | null {
  const last = requests.at(-1);
  return last === undefined ? null : { method: last.method, url: last.url };
}

function lastBody(requests: readonly AppStoreConnectRequest[]): unknown {
  const last = requests.at(-1);
  return last?.body === undefined ? null : (JSON.parse(last.body) as unknown);
}

function transport(requests: AppStoreConnectRequest[]): AppStoreConnectTransport {
  return (request) => {
    requests.push(request);
    return Promise.resolve({ status: request.method === 'DELETE' ? 204 : 200, body: '{}' });
  };
}
