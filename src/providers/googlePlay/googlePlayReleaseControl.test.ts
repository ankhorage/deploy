import { expect, test } from 'bun:test';

import { executeGooglePlayReleaseControl } from './executeGooglePlayReleaseControl';
import type { GooglePlayRequest, GooglePlayTransport } from './GooglePlayTransport';

test('Google Play halt preserves staged fraction and commits the complete track', async () => {
  const requests: GooglePlayRequest[] = [];
  const result = await executeGooglePlayReleaseControl(options(requests, 'halt'));
  expect(result.status).toBe('completed');
  expect(requests.map(requestLabel)).toEqual([
    'POST /edits',
    'GET /edits/edit-1/tracks/production',
    'PUT /edits/edit-1/tracks/production',
    'POST /edits/edit-1:commit',
  ]);
  expect(parsePutBody(requests)).toEqual(expectedHaltedTrack());
});

test('Google Play resume preserves the staged fraction', async () => {
  const requests: GooglePlayRequest[] = [];
  const result = await executeGooglePlayReleaseControl(options(requests, 'resume'));
  expect(result.status).toBe('completed');
  const body = parsePutBody(requests);
  expect(JSON.stringify(body)).toContain('"status":"inProgress"');
  expect(JSON.stringify(body)).toContain('"userFraction":0.25');
});

function options(requests: GooglePlayRequest[], action: 'halt' | 'resume') {
  return {
    control: { target: 'android', action } as const,
    packageName: 'com.example.app',
    track: 'production' as const,
    versionCode: '42',
    credentials: [{ provider: 'google-play', id: 'play', kind: 'service-account' }] as const,
    resolveSecret: () =>
      Promise.resolve(
        JSON.stringify({
          type: 'service_account',
          client_email: 'robot@example.test',
          private_key: 'PRIVATE_KEY_SENTINEL',
        }),
      ),
    createToken: () => Promise.resolve('token'),
    request: transport(requests, action === 'halt' ? 'inProgress' : 'halted'),
  };
}

function transport(
  requests: GooglePlayRequest[],
  status: 'inProgress' | 'halted',
): GooglePlayTransport {
  return (request) => {
    requests.push(request);
    if (request.method === 'POST' && request.url.endsWith('/edits')) {
      return Promise.resolve(response(200, { id: 'edit-1' }));
    }
    if (request.method === 'GET') return Promise.resolve(response(200, currentTrack(status)));
    return Promise.resolve(response(200, {}));
  };
}

function currentTrack(status: 'inProgress' | 'halted'): unknown {
  return {
    track: 'production',
    releases: [
      {
        name: '2.1.0',
        versionCodes: ['42'],
        releaseNotes: [{ language: 'de-CH', text: 'Neu' }],
        status,
        userFraction: 0.25,
        futureProviderField: { keep: true },
      },
      {
        name: 'legacy',
        versionCodes: ['41'],
        releaseNotes: [],
        status: 'completed',
      },
    ],
  };
}

function expectedHaltedTrack(): unknown {
  return {
    track: 'production',
    releases: [
      {
        name: '2.1.0',
        versionCodes: ['42'],
        releaseNotes: [{ language: 'de-CH', text: 'Neu' }],
        futureProviderField: { keep: true },
        status: 'halted',
        userFraction: 0.25,
      },
      {
        name: 'legacy',
        versionCodes: ['41'],
        releaseNotes: [],
        status: 'completed',
      },
    ],
  };
}

function parsePutBody(requests: readonly GooglePlayRequest[]): unknown {
  const put = requests.find((request) => request.method === 'PUT');
  return typeof put?.body === 'string' ? (JSON.parse(put.body) as unknown) : null;
}

function requestLabel(request: GooglePlayRequest): string {
  const marker = '/applications/com.example.app';
  return `${request.method} ${request.url.split(marker)[1] ?? request.url}`;
}

function response(status: number, body: unknown): { status: number; body: string } {
  return { status, body: JSON.stringify(body) };
}
