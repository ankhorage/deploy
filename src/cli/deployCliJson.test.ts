import type { AnkhCommandContext } from '@ankhorage/ankh';
import { expect, test } from 'bun:test';

import type { ReleasePlan } from '../index.js';
import type { ProjectReleaseInspection } from '../project/index.js';
import { DEPLOY_CLI_EXIT_CODES } from './DeployCliExitCodes.js';
import type { DeployCliRuntime } from './DeployCliRuntime.js';
import { handleDeployCliCommand } from './handleDeployCliCommand.js';

const inspection: ProjectReleaseInspection = {
  projectRoot: '/repo',
  desired: {
    version: '1.2.3',
    targets: ['web'],
    notes: [],
    rollout: {},
    revision: 'desired-revision',
  },
  observed: { targets: [] },
  currentRevision: 'current-revision',
  actions: [],
};

const changePlan: ReleasePlan = {
  status: 'changes',
  desiredRevision: 'desired-revision',
  currentRevision: 'current-revision',
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
  diagnostics: [],
};

test('JSON execution emits exactly one stable document', async () => {
  const memory = createContext('unavailable');
  const result = await handleDeployCliCommand(
    { argv: ['--yes', '--json', '--execution-id', 'ci-42'], context: memory.context },
    createRuntime(),
  );

  expect(result).toEqual({ exitCode: DEPLOY_CLI_EXIT_CODES.success });
  expect(memory.stderr.value).toBe('');
  const lines = memory.stdout.value.trim().split('\n');
  expect(lines).toHaveLength(1);
  const parsed: unknown = JSON.parse(lines[0] ?? '');
  expect(parsed).toMatchObject({
    kind: 'ankh-deploy-result',
    version: 1,
    phase: 'execute',
    status: 'completed',
    exitCode: 0,
    execution: { id: 'ci-42', historyRecorded: true },
  });
});

test('JSON mode never prompts and requires explicit --yes', async () => {
  let confirmations = 0;
  const memory = createContext('confirmed', () => {
    confirmations += 1;
  });
  const result = await handleDeployCliCommand(
    { argv: ['--json'], context: memory.context },
    createRuntime(),
  );

  expect(result).toEqual({ exitCode: DEPLOY_CLI_EXIT_CODES.confirmationRequired });
  expect(confirmations).toBe(0);
  expect(memory.stderr.value).toBe('');
  const parsed: unknown = JSON.parse(memory.stdout.value);
  expect(parsed).toMatchObject({
    phase: 'confirmation',
    status: 'confirmation-required',
    exitCode: 3,
  });
});

test('dry-run JSON is one plan document and performs no execution', async () => {
  let executions = 0;
  const memory = createContext('unavailable');
  const result = await handleDeployCliCommand(
    { argv: ['--dry-run', '--json'], context: memory.context },
    createRuntime(() => {
      executions += 1;
    }),
  );

  expect(result).toEqual({ exitCode: DEPLOY_CLI_EXIT_CODES.success });
  expect(executions).toBe(0);
  const parsed: unknown = JSON.parse(memory.stdout.value);
  expect(parsed).toMatchObject({
    phase: 'plan',
    status: 'planned',
    exitCode: 0,
    plan: { status: 'changes' },
  });
});

test('invalid JSON-mode input returns structured stdout and empty stderr', async () => {
  const memory = createContext('unavailable');
  const result = await handleDeployCliCommand(
    { argv: ['--json', '--unknown'], context: memory.context },
    createRuntime(),
  );

  expect(result).toEqual({ exitCode: DEPLOY_CLI_EXIT_CODES.failure });
  expect(memory.stderr.value).toBe('');
  const parsed: unknown = JSON.parse(memory.stdout.value);
  expect(parsed).toMatchObject({
    phase: 'input',
    status: 'failed',
    exitCode: 1,
    failure: { code: 'DEPLOY_CLI_INVALID_ARGUMENT' },
  });
});

function createRuntime(onExecute: () => void = () => undefined): DeployCliRuntime {
  return {
    inspectProjectRelease: () => Promise.resolve({ ok: true, inspection }),
    createProjectReleasePlan: () => changePlan,
    executeProjectRelease: () => {
      onExecute();
      return Promise.resolve({
        ok: true,
        execution: {
          result: {
            status: 'completed',
            plan: { ...changePlan, status: 'no-change', steps: [] },
            currentRevision: 'desired-revision',
            executedStepIds: ['web:publish'],
          },
          historyRecorded: true,
        },
      });
    },
    createExecutionId: () => 'generated',
  };
}

function createContext(
  confirmation: 'confirmed' | 'declined' | 'unavailable',
  onConfirm: () => void = () => undefined,
): {
  readonly context: AnkhCommandContext;
  readonly stdout: { value: string };
  readonly stderr: { value: string };
} {
  const stdout = { value: '' };
  const stderr = { value: '' };
  return {
    context: {
      cwd: '/repo',
      env: {},
      version: 'test',
      interaction: {
        interactive: confirmation !== 'unavailable',
        confirm: () => {
          onConfirm();
          return Promise.resolve(confirmation);
        },
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
