import type { AnkhCommandContext } from '@ankhorage/ankh';
import { expect, test } from 'bun:test';

import type { DeploymentRequiredAction, ReleasePlan, ReleaseReconcileResult } from '../index.js';
import type { ProjectReleaseExecution, ProjectReleaseInspection } from '../project/index.js';
import { DEPLOY_CLI_EXIT_CODES } from './DeployCliExitCodes.js';
import type { DeployCliRuntime } from './DeployCliRuntime.js';
import { handleDeployCliCommand } from './handleDeployCliCommand.js';

const basePlan: ReleasePlan = {
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
  diagnostics: [],
};

test('action-required inspection cannot be bypassed by --yes', async () => {
  let executions = 0;
  const action: DeploymentRequiredAction = {
    type: 'authentication',
    provider: 'eas',
    target: 'web',
    code: 'AUTH_REQUIRED',
    message: 'Authenticate first.',
  };
  const runtime = createRuntime({ actions: [action] }, completed(), () => {
    executions += 1;
  });
  const memory = createContext('unavailable');
  const result = await handleDeployCliCommand(
    { argv: ['--yes', '--json'], context: memory.context },
    runtime,
  );

  expect(result).toEqual({ exitCode: DEPLOY_CLI_EXIT_CODES.blocked });
  expect(executions).toBe(0);
  const parsed: unknown = JSON.parse(memory.stdout.value);
  expect(parsed).toMatchObject({ status: 'action-required', exitCode: 2 });
});

test('blocked and waiting plans use the blocked CI exit', async () => {
  for (const status of ['blocked', 'waiting'] as const) {
    const runtime = createRuntime({}, completed(), undefined, { ...basePlan, status, steps: [] });
    const memory = createContext('unavailable');
    const result = await handleDeployCliCommand(
      { argv: ['--yes', '--json'], context: memory.context },
      runtime,
    );
    expect(result).toEqual({ exitCode: DEPLOY_CLI_EXIT_CODES.blocked });
  }
});

test('interactive decline has a distinct deterministic exit code', async () => {
  let executions = 0;
  const memory = createContext('declined');
  const result = await handleDeployCliCommand(
    { argv: [], context: memory.context },
    createRuntime({}, completed(), () => {
      executions += 1;
    }),
  );

  expect(result).toEqual({ exitCode: DEPLOY_CLI_EXIT_CODES.declined });
  expect(executions).toBe(0);
  expect(memory.stderr.value).toContain('cancelled');
});

test('execution failure and drift have distinct exit semantics', async () => {
  const failedResult = await runExecution(execution('failed'));
  const driftedResult = await runExecution(execution('drifted', 'RELEASE_STATE_DRIFTED'));

  expect(failedResult).toBe(DEPLOY_CLI_EXIT_CODES.failure);
  expect(driftedResult).toBe(DEPLOY_CLI_EXIT_CODES.drifted);
});

test('completed release with failed history recording is non-zero', async () => {
  const historyFailed: ProjectReleaseExecution = {
    ...completed(),
    historyRecorded: false,
    historyFailure: {
      code: 'PROJECT_RELEASE_HISTORY_RECORD_FAILED',
      message: 'History failed.',
    },
  };
  const memory = createContext('unavailable');
  const response = await handleDeployCliCommand(
    { argv: ['--yes', '--json'], context: memory.context },
    createRuntime({}, historyFailed),
  );

  expect(response).toEqual({ exitCode: DEPLOY_CLI_EXIT_CODES.failure });
  const parsed: unknown = JSON.parse(memory.stdout.value);
  expect(parsed).toMatchObject({ phase: 'history', status: 'history-failed', exitCode: 1 });
});

async function runExecution(value: ProjectReleaseExecution): Promise<number> {
  const memory = createContext('unavailable');
  const response = await handleDeployCliCommand(
    { argv: ['--yes', '--json'], context: memory.context },
    createRuntime({}, value),
  );
  return response.exitCode;
}

function completed(): ProjectReleaseExecution {
  return execution('completed');
}

function execution(
  status: ReleaseReconcileResult['status'],
  code?: string,
): ProjectReleaseExecution {
  return {
    result: {
      status,
      plan: status === 'completed' ? { ...basePlan, status: 'no-change', steps: [] } : basePlan,
      currentRevision: 'desired',
      executedStepIds: [],
      ...(code === undefined ? {} : { code }),
    },
    historyRecorded: true,
  };
}

function createRuntime(
  inspectionPatch: Partial<ProjectReleaseInspection>,
  value: ProjectReleaseExecution,
  onExecute: (() => void) | undefined = undefined,
  plan: ReleasePlan = basePlan,
): DeployCliRuntime {
  const inspection: ProjectReleaseInspection = {
    projectRoot: '/repo',
    desired: { version: '1.0.0', targets: ['web'], notes: [], rollout: {}, revision: 'desired' },
    observed: { targets: [] },
    currentRevision: 'current',
    actions: [],
    ...inspectionPatch,
  };
  return {
    inspectProjectRelease: () => Promise.resolve({ ok: true, inspection }),
    createProjectReleasePlan: () => plan,
    executeProjectRelease: () => {
      onExecute?.();
      return Promise.resolve({ ok: true, execution: value });
    },
    createExecutionId: () => 'generated',
  };
}

function createContext(confirmation: 'confirmed' | 'declined' | 'unavailable'): {
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
        confirm: () => Promise.resolve(confirmation),
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
