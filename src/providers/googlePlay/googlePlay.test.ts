import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { StoreListingDesiredState } from '../../domain/storeListing/StoreListingDesiredState';
import type { EasAndroidBuildArtifact } from '../eas/android/EasAndroidBuildArtifact';
import type { GooglePlayServiceAccountCredentials } from './GooglePlayTokenFactory';
import type { GooglePlayRequest, GooglePlayTransport } from './GooglePlayTransport';
import { googlePlayInsertEditUrl } from './googlePlayUrls';
import { inspectGooglePlayStoreListing } from './inspectGooglePlayStoreListing';
import { inspectGooglePlayTrack } from './inspectGooglePlayTrack';
import { publishAndroidToGooglePlay } from './publishAndroidToGooglePlay';
import { replaceGooglePlayImages } from './replaceGooglePlayImages';
import { resolveGooglePlayAccessToken } from './resolveGooglePlayAccessToken';
import { verifyGooglePlayPublication } from './verifyGooglePlayPublication';
import { writeGooglePlayListing } from './writeGooglePlayListing';

const SECRET = JSON.stringify({
  type: 'service_account',
  client_email: 'robot@example.test',
  private_key: 'PRIVATE_KEY_SENTINEL',
  token_uri: 'https://malicious.example.test/token',
});
const CREDENTIAL: DeploymentCredentialReference = {
  provider: 'google-play',
  id: 'publisher',
  kind: 'service-account',
};
const RESOLVE_SECRET: DeploymentSecretResolver = () => Promise.resolve(SECRET);
const BUILD: EasAndroidBuildArtifact = {
  buildId: 'build-1',
  buildProfile: 'production',
  fingerprint: 'f'.repeat(40),
  versionCode: 42,
  archiveUrl: 'https://example.test/app.aab',
};

function releaseBody(versionCode = 42): string {
  return JSON.stringify({
    releases: [
      {
        releaseLifecycleState: 'RELEASE_LIFECYCLE_STATE_IN_REVIEW',
        activeArtifacts: [{ versionCode }],
      },
    ],
  });
}

test('Google Play auth strips untrusted service-account fields', async () => {
  const received: GooglePlayServiceAccountCredentials[] = [];
  const result = await resolveGooglePlayAccessToken({
    credentials: [CREDENTIAL],
    resolveSecret: RESOLVE_SECRET,
    createToken: (credentials) => {
      received.push(credentials);
      return Promise.resolve('ACCESS_TOKEN_SENTINEL');
    },
  });
  expect(result.ok).toBe(true);
  expect(received).toEqual([
    {
      clientEmail: 'robot@example.test',
      privateKey: 'PRIVATE_KEY_SENTINEL',
    },
  ]);
  expect(JSON.stringify(received)).not.toContain('malicious.example.test');
});

test('Google Play track inspection is read-only and normalizes releases', async () => {
  const requests: GooglePlayRequest[] = [];
  const result = await inspectGooglePlayTrack({
    packageName: 'com.example.app',
    track: 'internal',
    credentials: [CREDENTIAL],
    resolveSecret: RESOLVE_SECRET,
    createToken: () => Promise.resolve('token'),
    request: (request) => {
      requests.push(request);
      return Promise.resolve({ status: 200, body: releaseBody() });
    },
  });
  expect(result.status).toBe('completed');
  expect(requests).toHaveLength(1);
  expect(requests[0]?.method).toBe('GET');
  expect(requests[0]?.url).toContain('/applications/com.example.app/tracks/internal/releases');
  expect(JSON.stringify(result)).not.toContain(SECRET);
});

test('Google Play inspection distinguishes permission and bootstrap actions', async () => {
  const inspect = (status: number) =>
    inspectGooglePlayTrack({
      packageName: 'com.example.app',
      track: 'internal',
      credentials: [CREDENTIAL],
      resolveSecret: RESOLVE_SECRET,
      createToken: () => Promise.resolve('token'),
      request: () => Promise.resolve({ status, body: 'private provider body' }),
    });
  const forbidden = await inspect(403);
  const missing = await inspect(404);
  expect(forbidden.status).toBe('action-required');
  expect(missing.status).toBe('action-required');
  expect(JSON.stringify([forbidden, missing])).not.toContain('private provider body');
});

test('Google Play publish performs edit bundle track commit and cleans archive', async () => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), 'google-play-test-'));
  const filePath = path.join(directory, 'app.aab');
  await fs.writeFile(filePath, 'bundle');
  const requests: GooglePlayRequest[] = [];
  const result = await publishAndroidToGooglePlay({
    packageName: 'com.example.app',
    revision: 'r'.repeat(64),
    intent: { buildProfile: 'production', track: 'internal', releaseStatus: 'draft' },
    build: BUILD,
    credentials: [CREDENTIAL],
    resolveSecret: RESOLVE_SECRET,
    createToken: () => Promise.resolve('token'),
    request: createPublishTransport(requests),
    downloadArchive: () => Promise.resolve({ directory, filePath }),
  });
  expect(result.status).toBe('completed');
  expect(requests.map((request) => request.method)).toEqual(['POST', 'POST', 'PUT', 'POST']);
  const trackBody = requests[2]?.body;
  if (typeof trackBody !== 'string') throw new Error('Expected serialized track payload.');
  expect(trackBody).not.toContain('userFraction');
  expect(trackBody).toContain('"status":"draft"');
  expect(await exists(directory)).toBe(false);
});

test('Google Play version mismatch stops before track update and commit', async () => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), 'google-play-mismatch-'));
  const filePath = path.join(directory, 'app.aab');
  await fs.writeFile(filePath, 'bundle');
  const requests: GooglePlayRequest[] = [];
  const transport: GooglePlayTransport = (request) => {
    requests.push(request);
    return Promise.resolve(
      requests.length === 1
        ? { status: 200, body: JSON.stringify({ id: 'edit-1' }) }
        : { status: 200, body: JSON.stringify({ versionCode: 41 }) },
    );
  };
  const result = await publishAndroidToGooglePlay({
    packageName: 'com.example.app',
    revision: 'r'.repeat(64),
    intent: { buildProfile: 'production', track: 'internal', releaseStatus: 'completed' },
    build: BUILD,
    credentials: [CREDENTIAL],
    resolveSecret: RESOLVE_SECRET,
    createToken: () => Promise.resolve('token'),
    request: transport,
    downloadArchive: () => Promise.resolve({ directory, filePath }),
  });
  expect(result.status).toBe('failed');
  expect(requests).toHaveLength(2);
  expect(await exists(directory)).toBe(false);
});

test('Google Play verification accepts a current submitted version', async () => {
  const publication = {
    target: 'android',
    revision: 'r'.repeat(64),
    buildProvider: 'eas',
    publishProvider: 'google-play',
    buildId: 'build-1',
    versionCode: 42,
    track: 'internal',
    releaseStatus: 'completed',
  } as const;
  const result = await verifyGooglePlayPublication({
    packageName: 'com.example.app',
    publication,
    credentials: [CREDENTIAL],
    resolveSecret: RESOLVE_SECRET,
    createToken: () => Promise.resolve('token'),
    request: () => Promise.resolve({ status: 200, body: releaseBody(42) }),
  });
  expect(result).toEqual({ status: 'completed', verification: { ok: true } });
});

test('Google Play URL helpers encode path segments', () => {
  expect(googlePlayInsertEditUrl('com.example/app')).toContain('com.example%2Fapp');
});

function createPublishTransport(requests: GooglePlayRequest[]): GooglePlayTransport {
  return (request) => {
    requests.push(request);
    if (requests.length === 1) return Promise.resolve({ status: 200, body: '{"id":"edit-1"}' });
    if (requests.length === 2) return Promise.resolve({ status: 200, body: '{"versionCode":42}' });
    return Promise.resolve({ status: 200, body: '{}' });
  };
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

test('Google Play store listing inspection normalizes metadata and image hashes', async () => {
  const desired: StoreListingDesiredState = {
    revision: 'listing-revision',
    locales: [{ locale: 'de-CH', name: 'Ankh', summary: 'Kurz' }],
    assetSets: [{ target: 'android', locale: 'de-CH', variant: 'phone', assets: [] }],
  };
  const requests: GooglePlayRequest[] = [];
  const result = await inspectGooglePlayStoreListing({
    packageName: 'com.example.app',
    desired,
    credentials: [CREDENTIAL],
    resolveSecret: RESOLVE_SECRET,
    createToken: () => Promise.resolve('token'),
    request: (request) => {
      requests.push(request);
      if (requests.length === 1) {
        return Promise.resolve({ status: 200, body: JSON.stringify({ id: 'edit-1' }) });
      }
      if (requests.length === 2) {
        return Promise.resolve({
          status: 200,
          body: JSON.stringify({
            listings: [{ language: 'de-CH', title: 'Ankh', shortDescription: 'Kurz' }],
          }),
        });
      }
      return Promise.resolve({
        status: 200,
        body: JSON.stringify({ images: [{ sha256: 'remote-sha' }] }),
      });
    },
  });

  expect(result.status).toBe('completed');
  expect(requests.map((request) => request.method)).toEqual(['POST', 'GET', 'GET']);
  if (result.status === 'completed') {
    expect(result.state.assetSets[0]?.hashes).toEqual(['remote-sha']);
  }
});

test('Google Play listing writers update metadata and replace managed image sets', async () => {
  const requests: GooglePlayRequest[] = [];
  const request: GooglePlayTransport = (item) => {
    requests.push(item);
    return Promise.resolve({ status: 200, body: '{}' });
  };
  const metadata = await writeGooglePlayListing({
    packageName: 'com.example.app',
    editId: 'edit-1',
    token: 'token',
    operation: 'update-locale',
    listing: { locale: 'de-CH', name: 'Ankh', summary: 'Kurz' },
    request,
  });
  const images = await replaceGooglePlayImages({
    packageName: 'com.example.app',
    editId: 'edit-1',
    locale: 'de-CH',
    variant: 'phone',
    assets: [],
    token: 'token',
    request,
  });

  expect(metadata).toBe(true);
  expect(images).toBe(true);
  expect(requests.map((item) => item.method)).toEqual(['PATCH', 'DELETE']);
});
