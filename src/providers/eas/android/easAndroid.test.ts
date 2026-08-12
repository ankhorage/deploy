import { expect, test } from 'bun:test';

import type {
  DeploymentProcessRequest,
  DeploymentProcessRunner,
} from '../../../runtime/process/DeploymentProcessRunner';
import { buildAndroidWithEas } from './buildAndroidWithEas';
import { generateLocalAndroidFingerprint } from './generateLocalAndroidFingerprint';
import { inspectEasAndroidConfig } from './inspectEasAndroidConfig';

const SECRET = 'ANDROID_EAS_SECRET_SENTINEL';
const CREDENTIAL = { provider: 'eas', id: 'build', kind: 'expo-token' } as const;
const ACCESS = {
  credentials: [CREDENTIAL],
  resolveSecret: () => Promise.resolve(SECRET),
} as const;

function successfulConfig(buildProfile: Record<string, unknown> = {}) {
  return JSON.stringify({
    buildProfile,
    appConfig: { android: { package: 'com.example.app' } },
  });
}

test('EAS Android config validates package and store profile safely', async () => {
  const requests: DeploymentProcessRequest[] = [];
  const runProcess: DeploymentProcessRunner = (request) => {
    requests.push(request);
    return Promise.resolve({
      exitCode: 0,
      stdout: successfulConfig({ env: { APP_ENV: 'prod' } }),
      stderr: '',
    });
  };
  const result = await inspectEasAndroidConfig({
    projectRoot: '/project',
    packageName: 'com.example.app',
    buildProfile: 'production',
    runProcess,
    ...ACCESS,
  });
  expect(result.status).toBe('completed');
  expect(requests[0]?.args).toEqual([
    'config',
    '--platform',
    'android',
    '--profile',
    'production',
    '--json',
    '--non-interactive',
  ]);
  expect(requests[0]?.env?.EXPO_TOKEN).toBe(SECRET);
  expect(JSON.stringify(result)).not.toContain(SECRET);
});

test('EAS Android config rejects package mismatch and non-store profiles', async () => {
  const mismatch = await inspectEasAndroidConfig({
    projectRoot: '/project',
    packageName: 'com.other.app',
    buildProfile: 'production',
    runProcess: () => Promise.resolve({ exitCode: 0, stdout: successfulConfig(), stderr: '' }),
    ...ACCESS,
  });
  expect(mismatch.status).toBe('failed');
  const internal = await inspectEasAndroidConfig({
    projectRoot: '/project',
    packageName: 'com.example.app',
    buildProfile: 'preview',
    runProcess: () =>
      Promise.resolve({
        exitCode: 0,
        stdout: successfulConfig({ distribution: 'internal' }),
        stderr: '',
      }),
    ...ACCESS,
  });
  expect(internal.status).toBe('failed');
});

test('Android fingerprint is generated locally without an EAS command', async () => {
  let request: DeploymentProcessRequest | null = null;
  const result = await generateLocalAndroidFingerprint({
    projectRoot: '/project',
    profileEnvironment: { APP_ENV: 'prod' },
    runProcess: (value) => {
      request = value;
      return Promise.resolve({
        exitCode: 0,
        stdout: JSON.stringify({ hash: 'a'.repeat(40) }),
        stderr: '',
      });
    },
  });
  expect(result).toEqual({ status: 'completed', fingerprint: 'a'.repeat(40) });
  expect(request?.command).toBe('node');
  expect(request?.args[0]).toBe('--input-type=module');
  expect(request?.env?.APP_ENV).toBe('prod');
  expect(request?.args.includes('eas')).toBe(false);
});

test('EAS Android build normalizes one finished AAB build', async () => {
  const requests: DeploymentProcessRequest[] = [];
  const fingerprint = 'b'.repeat(40);
  const stdout = JSON.stringify([
    {
      id: 'build-id',
      status: 'FINISHED',
      platform: 'ANDROID',
      buildProfile: 'production',
      appBuildVersion: '42',
      fingerprint: { hash: fingerprint },
      artifacts: { applicationArchiveUrl: 'https://example.test/app.aab' },
    },
  ]);
  const result = await buildAndroidWithEas({
    projectRoot: '/project',
    buildProfile: 'production',
    expectedFingerprint: fingerprint,
    runProcess: (request) => {
      requests.push(request);
      return Promise.resolve({ exitCode: 0, stdout, stderr: '' });
    },
    ...ACCESS,
  });
  expect(result.status).toBe('completed');
  expect(requests[0]?.args).toEqual([
    'build',
    '--platform',
    'android',
    '--profile',
    'production',
    '--json',
    '--non-interactive',
    '--wait',
  ]);
  expect(requests[0]?.env?.EXPO_TOKEN).toBe(SECRET);
  expect(JSON.stringify(result)).not.toContain(SECRET);
});

test('EAS Android build rejects fingerprint drift and hides provider output', async () => {
  const result = await buildAndroidWithEas({
    projectRoot: '/project',
    buildProfile: 'production',
    expectedFingerprint: 'c'.repeat(40),
    runProcess: () => Promise.resolve({ exitCode: 1, stdout: '', stderr: SECRET }),
    ...ACCESS,
  });
  expect(result.status).toBe('failed');
  expect(JSON.stringify(result)).not.toContain(SECRET);
});
