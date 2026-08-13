import { expect, test } from 'bun:test';

import type { GooglePlayRequest, GooglePlayTransport } from './GooglePlayTransport';
import { updateGooglePlayReleaseInEdit } from './updateGooglePlayReleaseInEdit';

test('Google Play release update preserves unrelated provider-managed release state', async () => {
  const requests: GooglePlayRequest[] = [];
  const result = await updateGooglePlayReleaseInEdit({
    packageName: 'com.example.app',
    editId: 'edit-1',
    track: 'production',
    targetVersionCode: '42',
    releaseNotes: [{ locale: 'de-CH', text: 'Neu' }],
    rollout: { mode: 'staged', initialFraction: '0.1' },
    token: 'TOKEN_SENTINEL',
    request: transport(requests),
  });
  expect(result).toBe(true);
  const put = requests.find((request) => request.method === 'PUT');
  expect(put).toBeDefined();
  const body = parseBody(put?.body);
  expect(body).toEqual(expectedTrackBody());
  expect(JSON.stringify(body)).not.toContain('TOKEN_SENTINEL');
});

test('Google Play release update refuses an ambiguous target release', async () => {
  const requests: GooglePlayRequest[] = [];
  const result = await updateGooglePlayReleaseInEdit({
    packageName: 'com.example.app',
    editId: 'edit-1',
    track: 'production',
    targetVersionCode: '999',
    releaseNotes: [],
    rollout: { mode: 'immediate' },
    token: 'token',
    request: transport(requests),
  });
  expect(result).toBe(false);
  expect(requests.some((request) => request.method === 'PUT')).toBe(false);
});

function transport(requests: GooglePlayRequest[]): GooglePlayTransport {
  return (request) => {
    requests.push(request);
    return Promise.resolve(
      request.method === 'GET' ? response(200, currentTrack()) : response(200, {}),
    );
  };
}

function currentTrack(): unknown {
  return {
    track: 'production',
    releases: [
      {
        name: '2.1.0',
        versionCodes: ['41', '42'],
        releaseNotes: [
          { language: 'de-CH', text: 'Alt' },
          { language: 'fr-FR', text: 'Conserver' },
        ],
        status: 'inProgress',
        userFraction: 0.25,
        countryTargeting: { countries: ['CH'], includeRestOfWorld: false },
        inAppUpdatePriority: 3,
        futureProviderField: { keep: true },
      },
      {
        name: 'legacy',
        versionCodes: ['40'],
        status: 'completed',
        releaseNotes: [{ language: 'en-US', text: 'Legacy' }],
      },
    ],
  };
}

function expectedTrackBody(): unknown {
  return {
    track: 'production',
    releases: [
      {
        name: '2.1.0',
        countryTargeting: { countries: ['CH'], includeRestOfWorld: false },
        inAppUpdatePriority: 3,
        futureProviderField: { keep: true },
        versionCodes: ['41', '42'],
        releaseNotes: [
          { language: 'de-CH', text: 'Neu' },
          { language: 'fr-FR', text: 'Conserver' },
        ],
        status: 'inProgress',
        userFraction: 0.1,
      },
      {
        name: 'legacy',
        versionCodes: ['40'],
        status: 'completed',
        releaseNotes: [{ language: 'en-US', text: 'Legacy' }],
      },
    ],
  };
}

function parseBody(body: GooglePlayRequest['body']): unknown {
  if (typeof body !== 'string') return null;
  return JSON.parse(body) as unknown;
}

function response(status: number, body: unknown): { status: number; body: string } {
  return { status, body: JSON.stringify(body) };
}
