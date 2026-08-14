import { expect, test } from 'bun:test';

import type { AppStoreConnectRequest, AppStoreConnectTransport } from './AppStoreConnectTransport';
import { executeAppStoreReleaseMutation } from './executeAppStoreReleaseMutation';

test('immediate iOS intent completes an active phased release explicitly', async () => {
  const requests: AppStoreConnectRequest[] = [];
  const result = await executeAppStoreReleaseMutation({
    step: {
      id: 'ios:rollout',
      target: 'ios',
      operation: 'rollout',
      dependsOn: [],
      retry: 'reinspect',
      irreversible: true,
    },
    desired: {
      version: '2.1.0',
      targets: ['ios'],
      notes: [],
      rollout: { ios: { mode: 'immediate' } },
      revision: 'desired',
    },
    snapshot: {
      appId: 'app-1',
      version: '2.1.0',
      versionId: 'version-1',
      releaseNotes: [],
      reviewSubmission: null,
      phasedRelease: { id: 'phase-1', state: 'ACTIVE' },
    },
    credentials: [{ provider: 'app-store-connect', id: 'apple', kind: 'api-key' }],
    resolveSecret: () =>
      Promise.resolve(JSON.stringify({ keyId: 'KEY', issuerId: 'ISSUER', privateKey: 'PRIVATE' })),
    createToken: () => Promise.resolve('token'),
    request: transport(requests),
    now: new Date('2026-08-14T00:00:00Z'),
  });
  expect(result.status).toBe('completed');
  const patch = requests.find((request) => request.method === 'PATCH');
  expect(patch?.url).toBe(
    'https://api.appstoreconnect.apple.com/v1/appStoreVersionPhasedReleases/phase-1',
  );
  expect(parseBody(patch?.body)).toEqual({
    data: {
      type: 'appStoreVersionPhasedReleases',
      id: 'phase-1',
      attributes: { phasedReleaseState: 'COMPLETE' },
    },
  });
});

function transport(requests: AppStoreConnectRequest[]): AppStoreConnectTransport {
  return (request) => {
    requests.push(request);
    return Promise.resolve({ status: 200, body: '{}' });
  };
}

function parseBody(body: string | undefined): unknown {
  return body === undefined ? null : (JSON.parse(body) as unknown);
}
