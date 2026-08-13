import { expect, test } from 'bun:test';

import type {
  DeploymentProcessRequest,
  DeploymentProcessRunner,
} from '../../../runtime/process/DeploymentProcessRunner';
import { buildIosWithEas } from './buildIosWithEas';
import { generateLocalIosFingerprint } from './generateLocalIosFingerprint';
import { inspectEasIosConfig } from './inspectEasIosConfig';

const SECRET = 'IOS_EAS_SECRET_SENTINEL';
const CREDENTIAL = { provider: 'eas', id: 'build', kind: 'expo-token' } as const;
const ACCESS = { credentials: [CREDENTIAL], resolveSecret: () => Promise.resolve(SECRET) } as const;

function successfulConfig(buildProfile: Record<string, unknown> = {}) {
  return JSON.stringify({
    buildProfile,
    appConfig: { ios: { bundleIdentifier: 'com.example.app' } },
  });
}

test('EAS iOS config validates bundle identity and store profile safely', async () => {
  const requests: DeploymentProcessRequest[] = [];
  const result = await inspectEasIosConfig({
    projectRoot: '/project',
    bundleIdentifier: 'com.example.app',
    buildProfile: 'production',
    runProcess: (request) => {
      requests.push(request);
      return Promise.resolve({ exitCode: 0, stdout: successfulConfig(), stderr: '' });
    },
    ...ACCESS,
  });
  expect(result.status).toBe('completed');
  expect(requests[0]?.args).toEqual([
    'config',
    '--platform',
    'ios',
    '--profile',
    'production',
    '--json',
    '--non-interactive',
  ]);
  expect(requests[0]?.env?.EXPO_TOKEN).toBe(SECRET);
  expect(JSON.stringify(result)).not.toContain(SECRET);
});

test('EAS iOS config rejects bundle mismatch and simulator profile', async () => {
  const mismatch = await inspectEasIosConfig({
    projectRoot: '/project',
    bundleIdentifier: 'com.other.app',
    buildProfile: 'production',
    runProcess: () => Promise.resolve({ exitCode: 0, stdout: successfulConfig(), stderr: '' }),
    ...ACCESS,
  });
  expect(mismatch.status).toBe('failed');
  const simulator = await inspectEasIosConfig({
    projectRoot: '/project',
    bundleIdentifier: 'com.example.app',
    buildProfile: 'preview',
    runProcess: () =>
      Promise.resolve({
        exitCode: 0,
        stdout: successfulConfig({ ios: { simulator: true } }),
        stderr: '',
      }),
    ...ACCESS,
  });
  expect(simulator.status).toBe('failed');
});

test('iOS fingerprint is generated locally without an EAS command', async () => {
  const requests: DeploymentProcessRequest[] = [];
  const result = await generateLocalIosFingerprint({
    projectRoot: '/project',
    profileEnvironment: { APP_ENV: 'prod' },
    runProcess: (request) => {
      requests.push(request);
      return Promise.resolve({
        exitCode: 0,
        stdout: JSON.stringify({ hash: 'a'.repeat(40) }),
        stderr: '',
      });
    },
  });
  expect(result).toEqual({ status: 'completed', fingerprint: 'a'.repeat(40) });
  expect(requests[0]?.command).toBe('node');
  expect(requests[0]?.args.includes('eas')).toBe(false);
});

test('EAS iOS build normalizes one finished IPA build', async () => {
  const fingerprint = 'b'.repeat(40);
  const requests: DeploymentProcessRequest[] = [];
  const stdout = JSON.stringify([
    {
      id: 'build-id',
      status: 'FINISHED',
      platform: 'IOS',
      buildProfile: 'production',
      appVersion: '1.2.3',
      appBuildVersion: '42',
      fingerprint: { hash: fingerprint },
      artifacts: { applicationArchiveUrl: 'https://example.test/app.ipa' },
    },
  ]);
  const result = await buildIosWithEas({
    projectRoot: '/project',
    buildProfile: 'production',
    expectedFingerprint: fingerprint,
    expectedVersion: '1.2.3',
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
    'ios',
    '--profile',
    'production',
    '--json',
    '--non-interactive',
    '--wait',
  ]);
  expect(JSON.stringify(result)).not.toContain(SECRET);
});

test('EAS iOS signing failure becomes an action without stderr leakage', async () => {
  const result = await buildIosWithEas({
    projectRoot: '/project',
    buildProfile: 'production',
    expectedFingerprint: 'c'.repeat(40),
    expectedVersion: '1.2.3',
    runProcess: () =>
      Promise.resolve({ exitCode: 1, stdout: '', stderr: `${SECRET} provisioning profile` }),
    ...ACCESS,
  });
  expect(result.status).toBe('action-required');
  expect(JSON.stringify(result)).not.toContain(SECRET);
});
