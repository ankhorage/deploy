import { expect, test } from 'bun:test';

import { normalizeAppStoreReleaseObservation } from '../appStoreConnect/normalizeAppStoreReleaseObservation';
import { normalizeGooglePlayReleaseObservation } from '../googlePlay/normalizeGooglePlayReleaseObservation';
import { createWebReleaseObservation } from './createWebReleaseObservation';

test('Google Play release snapshot normalizes without provider ids', () => {
  const observed = normalizeGooglePlayReleaseObservation({
    desiredVersion: '2.1.0',
    publication: {
      target: 'android',
      revision: 'rev',
      buildProvider: 'eas',
      publishProvider: 'google-play',
      buildId: 'build',
      versionCode: 42,
      track: 'production',
      releaseStatus: 'draft',
    },
    snapshot: {
      track: 'production',
      summary: { track: 'production', releases: [] },
      releases: [
        {
          status: 'inProgress',
          versionCodes: ['42'],
          releaseNotes: [{ locale: 'en-US', text: 'New' }],
          userFraction: '0.1',
        },
      ],
    },
  });
  expect(observed.artifactRevision).toBe('rev');
  expect(observed.userFraction).toBe('0.1');
  expect(JSON.stringify(observed)).not.toContain('build');
});

test('App Store artifact identity is included only after publication verification', () => {
  const snapshot = {
    appId: 'provider-app-id',
    version: '2.1.0',
    versionId: 'provider-version-id',
    appVersionState: 'WAITING_FOR_REVIEW',
    releaseNotes: [{ locale: 'en-US', text: 'New' }],
    reviewSubmission: { id: 'provider-review-id', state: 'WAITING_FOR_REVIEW' },
    phasedRelease: null,
  } as const;
  const publication = {
    target: 'ios',
    revision: 'ios-rev',
    buildProvider: 'eas',
    publishProvider: 'app-store-connect',
    buildId: 'build-id',
    version: '2.1.0',
    buildNumber: '42',
  } as const;
  expect(
    normalizeAppStoreReleaseObservation({
      publication,
      publicationVerified: false,
      snapshot,
    }).artifactRevision,
  ).toBeNull();
  const observed = normalizeAppStoreReleaseObservation({
    publication,
    publicationVerified: true,
    snapshot,
  });
  expect(observed.artifactRevision).toBe('ios-rev');
  expect(JSON.stringify(observed)).not.toContain('provider-version-id');
  expect(JSON.stringify(observed)).not.toContain('provider-review-id');
});

test('Web publication normalizes without provider deployment identity', () => {
  const observed = createWebReleaseObservation('2.1.0', {
    target: 'web',
    revision: 'web-rev',
    provider: 'vercel',
    deploymentId: 'provider-deployment-id',
    url: 'https://example.test',
    production: true,
  });
  expect(observed).toEqual({
    target: 'web',
    version: '2.1.0',
    artifactRevision: 'web-rev',
  });
});
