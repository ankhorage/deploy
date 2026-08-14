import type { AnkhCommandContext } from '@ankhorage/ankh';
import { expect, test } from 'bun:test';

import type { ReleasePlan } from '../index.js';
import { createProjectReleaseHistoryRecord } from '../project/index.js';
import { createDeployCliAccess } from './createDeployCliAccess.js';
import { DEPLOY_CLI_ENVIRONMENT } from './DeployCliEnvironment.js';
import type { DeployCliRuntime } from './DeployCliRuntime.js';
import { handleDeployCliCommand } from './handleDeployCliCommand.js';
import { handleDeployCliPlan } from './handleDeployCliPlan.js';
import { parseDeployCliOptions } from './parseDeployCliOptions.js';

const GOOGLE = 'GOOGLE_PHASE4_SECRET_PRIVATE_KEY';
const APPLE = 'APPLE_PHASE4_SECRET_PRIVATE_KEY';
const EAS = 'EAS_PHASE4_SECRET_TOKEN';
const env = {
  [DEPLOY_CLI_ENVIRONMENT.googlePlayServiceAccountJson]: JSON.stringify({
    type: 'service_account',
    private_key: GOOGLE,
  }),
  [DEPLOY_CLI_ENVIRONMENT.appStoreConnectApiKeyJson]: JSON.stringify({
    keyId: 'SAFE_KEY_ID',
    issuerId: 'SAFE_ISSUER',
    privateKey: APPLE,
  }),
  [DEPLOY_CLI_ENVIRONMENT.easToken]: EAS,
};

const plan: ReleasePlan = {
  status: 'changes',
  desiredRevision: 'desired',
  currentRevision: 'current',
  steps: [
    {
      id: 'web:publish',
      target: 'web',
      operation: 'publish',
      dependsOn: [],
      irreversible: false,
      retry: 'safe',
    },
  ],
  diagnostics: [{ severity: 'warning', code: 'SENTINEL', message: `provider detail ${GOOGLE}` }],
};

test('JSON and human output redact all transient credential sentinels', async () => {
  const runtime = createRuntime();
  const json = createContext(env);
  const human = createContext(env);

  await handleDeployCliCommand({ argv: ['--dry-run', '--json'], context: json.context }, runtime);
  await handleDeployCliCommand({ argv: ['--dry-run'], context: human.context }, runtime);

  assertNoSecrets(json.stdout.value);
  assertNoSecrets(json.stderr.value);
  assertNoSecrets(human.stdout.value);
  assertNoSecrets(human.stderr.value);
  expect(json.stdout.value).toContain('[REDACTED]');
  expect(human.stdout.value).toContain('[REDACTED]');
});

test('Ankh planning diagnostics redact secret-bearing owner messages', async () => {
  const memory = createContext(env);
  const result = await handleDeployCliPlan({ argv: [], context: memory.context }, createRuntime());

  const serialized = JSON.stringify(result);
  assertNoSecrets(serialized);
  expect(serialized).toContain('[REDACTED]');
});

test('transient ENV secrets do not serialize into access or release history', () => {
  const parsed = parseDeployCliOptions([], '/repo');
  expect(parsed.ok).toBeTrue();
  if (!parsed.ok) return;
  const access = createDeployCliAccess(parsed.options, env);
  const historyPlan: ReleasePlan = { ...plan, diagnostics: [] };
  const history = createProjectReleaseHistoryRecord({
    executionId: 'history-test',
    recordedAt: '2026-08-14T10:00:00.000Z',
    desired: {
      version: '1.0.0',
      targets: ['web'],
      notes: [],
      rollout: {},
      revision: 'desired',
    },
    initialPlan: historyPlan,
    result: {
      status: 'completed',
      plan: { ...historyPlan, status: 'no-change', steps: [] },
      currentRevision: 'desired',
      executedStepIds: ['web:publish'],
    },
  });

  assertNoSecrets(JSON.stringify(access));
  assertNoSecrets(JSON.stringify(history));
});

test('JSON inspection failures are redacted and never spill to stderr', async () => {
  const memory = createContext(env);
  const runtime: DeployCliRuntime = {
    inspectProjectRelease: () =>
      Promise.resolve({
        ok: false,
        failure: { code: 'INSPECT_FAILED', message: `provider failed with ${APPLE}` },
      }),
    createProjectReleasePlan: () => plan,
    executeProjectRelease: () => Promise.reject(new Error('must not execute')),
    createExecutionId: () => 'unused',
  };
  const result = await handleDeployCliCommand(
    { argv: ['--json'], context: memory.context },
    runtime,
  );

  expect(result.exitCode).toBe(1);
  expect(memory.stderr.value).toBe('');
  assertNoSecrets(memory.stdout.value);
  expect(memory.stdout.value).toContain('[REDACTED]');
});

function createRuntime(): DeployCliRuntime {
  return {
    inspectProjectRelease: () =>
      Promise.resolve({
        ok: true,
        inspection: {
          projectRoot: '/repo',
          desired: {
            version: '1.0.0',
            targets: ['web'],
            notes: [],
            rollout: {},
            revision: 'desired',
          },
          observed: { targets: [] },
          currentRevision: 'current',
          actions: [
            {
              type: 'authentication',
              provider: 'eas',
              target: 'web',
              code: 'AUTH_REQUIRED',
              message: `authenticate using ${EAS} and ${APPLE}`,
            },
          ],
        },
      }),
    createProjectReleasePlan: () => plan,
    executeProjectRelease: () => Promise.reject(new Error('must not execute')),
    createExecutionId: () => 'unused',
  };
}

function createContext(environment: Readonly<Record<string, string | undefined>>): {
  readonly context: AnkhCommandContext;
  readonly stdout: { value: string };
  readonly stderr: { value: string };
} {
  const stdout = { value: '' };
  const stderr = { value: '' };
  return {
    context: {
      cwd: '/repo',
      env: environment,
      version: 'test',
      interaction: {
        interactive: false,
        confirm: () => Promise.resolve('unavailable'),
      },
      writeStdout: (text) => {
        stdout.value += text;
      },
      writeStderr: (text) => {
        stderr.value += text;
      },
    },
    stdout,
    stderr,
  };
}

function assertNoSecrets(value: string): void {
  expect(value).not.toContain(GOOGLE);
  expect(value).not.toContain(APPLE);
  expect(value).not.toContain(EAS);
}
