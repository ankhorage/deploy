import { expect, test } from 'bun:test';

import { executeGooglePlayReleaseMutation } from './executeGooglePlayReleaseMutation';
import type { GooglePlayRequest, GooglePlayTransport } from './GooglePlayTransport';

test('Google Play release-note mutation preserves rollout state and commits the edit', async () => {
  const requests: GooglePlayRequest[] = [];
  const result = await executeGooglePlayReleaseMutation(createOptions(requests));

  expect(result.status).toBe('completed');
  expect(requests.map(requestLabel)).toEqual(expectedRequestFlow());
  expect(parsePutBody(requests)).toEqual(expectedPutBody());
  expect(serializedBodies(requests)).not.toContain('PRIVATE_KEY_SENTINEL');
});

function createOptions(requests: GooglePlayRequest[]) {
  return {
    step: {
      id: 'android:sync-notes',
      target: 'android',
      operation: 'sync-notes',
      dependsOn: [],
      retry: 'reinspect',
      irreversible: false,
    } as const,
    desired: {
      version: '2.1.0',
      targets: ['android'],
      notes: [{ locale: 'de-CH', text: 'Neu' }],
      rollout: { android: { mode: 'staged', initialFraction: '0.1' } },
      revision: 'desired',
    } as const,
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
    createToken: () => Promise.resolve('google-token'),
    request: createTransport(requests),
  };
}

function expectedRequestFlow(): string[] {
  return [
    'POST /edits',
    'GET /edits/edit-1/tracks/production',
    'PUT /edits/edit-1/tracks/production',
    'POST /edits/edit-1:commit',
  ];
}

function expectedPutBody(): unknown {
  return {
    track: 'production',
    releases: [
      {
        name: '2.1.0',
        versionCodes: ['42'],
        releaseNotes: [
          { language: 'de-CH', text: 'Neu' },
          { language: 'fr-FR', text: 'Conserver' },
        ],
        status: 'inProgress',
        userFraction: 0.25,
      },
    ],
  };
}

function parsePutBody(requests: readonly GooglePlayRequest[]): unknown {
  const put = requests.find((request) => request.method === 'PUT');
  return parseBody(put?.body);
}

function serializedBodies(requests: readonly GooglePlayRequest[]): string {
  return JSON.stringify(requests.map((request) => request.body));
}

function createTransport(requests: GooglePlayRequest[]): GooglePlayTransport {
  return (request) => {
    requests.push(request);
    return Promise.resolve(responseFor(request));
  };
}

function responseFor(request: GooglePlayRequest): { status: number; body: string } {
  if (request.method === 'POST' && request.url.endsWith('/edits')) {
    return response(200, { id: 'edit-1' });
  }
  if (request.method === 'GET' && request.url.endsWith('/edits/edit-1/tracks/production')) {
    return response(200, currentTrack());
  }
  if (request.method === 'PUT' && request.url.endsWith('/edits/edit-1/tracks/production')) {
    return response(200, {});
  }
  if (request.method === 'POST' && request.url.endsWith('/edits/edit-1:commit')) {
    return response(200, {});
  }
  return response(404, {});
}

function currentTrack(): unknown {
  return {
    track: 'production',
    releases: [
      {
        name: '2.1.0',
        versionCodes: ['42'],
        releaseNotes: [
          { language: 'de-CH', text: 'Alt' },
          { language: 'fr-FR', text: 'Conserver' },
        ],
        status: 'inProgress',
        userFraction: 0.25,
      },
    ],
  };
}

function requestLabel(request: GooglePlayRequest): string {
  const marker = '/applications/com.example.app';
  return `${request.method} ${request.url.split(marker)[1] ?? request.url}`;
}

function parseBody(body: GooglePlayRequest['body']): unknown {
  return typeof body === 'string' ? (JSON.parse(body) as unknown) : null;
}

function response(status: number, body: unknown): { status: number; body: string } {
  return { status, body: JSON.stringify(body) };
}
