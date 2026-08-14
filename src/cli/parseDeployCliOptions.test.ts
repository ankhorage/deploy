import { expect, test } from 'bun:test';

import { createDeployCliAccess } from './createDeployCliAccess.js';
import { DEPLOY_CLI_ENVIRONMENT } from './DeployCliEnvironment.js';
import { parseDeployCliOptions } from './parseDeployCliOptions.js';

test('parses operational release context without defaulting Android track', () => {
  const parsed = parseDeployCliOptions(
    [
      '--dry-run',
      '--android-track',
      'beta',
      '--android-build-profile',
      'store',
      '--ios-build-profile',
      'ios-store',
      '--web-alias',
      'production',
      '--web-environment',
      'production',
    ],
    '/repo',
  );

  expect(parsed.ok).toBeTrue();
  if (!parsed.ok) return;
  expect(parsed.options.androidTrack).toBe('beta');
  expect(parsed.options.projectRoot).toBe('/repo');
  expect(parsed.options.dryRun).toBeTrue();
});

test('rejects Android tracks outside the owner union', () => {
  const parsed = parseDeployCliOptions(['--android-track', 'preview'], '/repo');

  expect(parsed).toEqual({
    ok: false,
    message: 'Invalid Android track: preview. Expected one of: internal, alpha, beta, production.',
  });
});

test('requires an explicit Android track when an Android build profile is supplied', () => {
  const parsed = parseDeployCliOptions(['--android-build-profile', 'store'], '/repo');

  expect(parsed).toEqual({
    ok: false,
    message: '--android-build-profile requires --android-track.',
  });
});

test('maps transient environment secrets to references without serializing secret values', async () => {
  const parsed = parseDeployCliOptions(['--android-track', 'internal'], '/repo');
  expect(parsed.ok).toBeTrue();
  if (!parsed.ok) return;

  const googleSecret =
    '{"type":"service_account","client_email":"bot@example.test","private_key":"SECRET"}';
  const appleSecret = '{"keyId":"K","issuerId":"I","privateKey":"APPLE_SECRET"}';
  const access = createDeployCliAccess(parsed.options, {
    [DEPLOY_CLI_ENVIRONMENT.googlePlayServiceAccountJson]: googleSecret,
    [DEPLOY_CLI_ENVIRONMENT.appStoreConnectApiKeyJson]: appleSecret,
    [DEPLOY_CLI_ENVIRONMENT.easToken]: 'EAS_SECRET',
  });

  expect(access.credentials).toHaveLength(3);
  const google = access.credentials?.find((item) => item.provider === 'google-play');
  expect(google).toBeDefined();
  if (google === undefined || access.resolveSecret === undefined) return;
  expect(await access.resolveSecret(google)).toBe(googleSecret);
  expect(JSON.stringify(access)).not.toContain('SECRET');
  expect(JSON.stringify(access)).not.toContain('APPLE_SECRET');
  expect(JSON.stringify(access)).not.toContain('EAS_SECRET');
});
