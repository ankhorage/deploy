import { expect, test } from 'bun:test';

import type { GooglePlayRequest, GooglePlayTransport } from './GooglePlayTransport';
import { inspectGooglePlayReleaseState } from './inspectGooglePlayReleaseState';

const ACCESS = {
  packageName: 'com.example.app',
  track: 'production' as const,
  credentials: [{ provider: 'google-play', id: 'play', kind: 'service-account' }],
  resolveSecret: () =>
    Promise.resolve(
      JSON.stringify({
        type: 'service_account',
        client_email: 'robot@example.test',
        private_key: 'PRIVATE_KEY_SENTINEL',
      }),
    ),
  createToken: () => Promise.resolve('google-token'),
};

test('Google Play release inspection combines review lifecycle and configured rollout', async () => {
  const requests: GooglePlayRequest[] = [];
  const result = await inspectGooglePlayReleaseState({
    ...ACCESS,
    request: createTransport(requests),
  });
  expect(result.status).toBe('completed');
  if (result.status !== 'completed') return;
  expect(result.state.summary.releases[0]?.lifecycle).toBe('RELEASE_LIFECYCLE_STATE_PUBLISHED');
  expect(result.state.releases).toEqual([
    {
      status: 'inProgress',
      versionCodes: ['42'],
      releaseNotes: [{ locale: 'de-CH', text: 'Neu' }],
      userFraction: '0.1',
    },
  ]);
  expect(requests.filter((request) => request.method === 'POST')).toHaveLength(1);
  expect(requests.some((request) => request.method === 'PUT')).toBe(false);
  expect(JSON.stringify(result)).not.toContain('PRIVATE_KEY_SENTINEL');
});

function createTransport(requests: GooglePlayRequest[]): GooglePlayTransport {
  return (request) => {
    requests.push(request);
    return Promise.resolve(responseFor(request));
  };
}

function responseFor(request: GooglePlayRequest): { status: number; body: string } {
  if (request.method === 'GET' && request.url.endsWith('/tracks/production/releases')) {
    return response(200, {
      releases: [
        {
          releaseLifecycleState: 'RELEASE_LIFECYCLE_STATE_PUBLISHED',
          activeArtifacts: [{ versionCode: 42 }],
        },
      ],
    });
  }
  if (request.method === 'POST' && request.url.endsWith('/edits')) {
    return response(200, { id: 'edit-1' });
  }
  if (request.method === 'GET' && request.url.endsWith('/edits/edit-1/tracks/production')) {
    return response(200, configuredTrack());
  }
  return response(404, {});
}

function configuredTrack(): unknown {
  return {
    track: 'production',
    releases: [
      {
        versionCodes: ['42'],
        releaseNotes: [{ language: 'de-ch', text: 'Neu' }],
        status: 'inProgress',
        userFraction: 0.1,
      },
    ],
  };
}

function response(status: number, body: unknown): { status: number; body: string } {
  return { status, body: JSON.stringify(body) };
}
