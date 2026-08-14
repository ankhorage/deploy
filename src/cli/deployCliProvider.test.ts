import type { AnkhCommandContext } from '@ankhorage/ankh';
import { expect, test } from 'bun:test';

import type { ReleasePlan } from '../index.js';
import type {
  ExecuteProjectReleaseOptions,
  InspectProjectReleaseOptions,
  ProjectReleaseInspection,
} from '../project/index.js';
import { createDeployCliProvider } from './createDeployCliProvider.js';
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

test('provider exposes exactly one category-root deploy command', () => {
  const runtime = createRuntime(changePlan);
  const provider = createDeployCliProvider(runtime);

  expect(provider.category).toBe('deploy');
  expect(provider.commands).toHaveLength(1);
  expect(provider.commands[0]?.path).toEqual([]);
  expect(provider.handlers?.[0]?.path).toEqual([]);
  expect(provider.planningHandlers?.[0]?.path).toEqual([]);
});

test('dry-run renders the owner plan and never invokes execution', async () => {
  let executions = 0;
  const runtime = createRuntime(changePlan, () => {
    executions += 1;
  });
  const memory = createContext('unavailable');

  const result = await handleDeployCliCommand(
    { argv: ['--dry-run'], context: memory.context },
    runtime,
  );

  expect(result).toEqual({ exitCode: 0 });
  expect(executions).toBe(0);
  expect(memory.stdout.value).toContain('Release: 1.2.3');
  expect(memory.stdout.value).toContain('[web] publish');
  expect(memory.stdout.value).toContain('irreversible: no');
});

test('non-interactive mutation fails without explicit approval', async () => {
  let executions = 0;
  const runtime = createRuntime(changePlan, () => {
    executions += 1;
  });
  const memory = createContext('unavailable');

  const result = await handleDeployCliCommand({ argv: [], context: memory.context }, runtime);

  expect(result).toEqual({ exitCode: 1 });
  expect(executions).toBe(0);
  expect(memory.stderr.value).toContain('Use --yes');
});

test('--yes executes through the project owner without prompting', async () => {
  let executions = 0;
  let executedOptions: ExecuteProjectReleaseOptions | undefined;
  const runtime = createRuntime(changePlan, (options) => {
    executions += 1;
    executedOptions = options;
  });
  const memory = createContext('unavailable');

  const result = await handleDeployCliCommand(
    {
      argv: ['--yes', '--execution-id', 'release-test', '--web-alias', 'production'],
      context: memory.context,
    },
    runtime,
  );

  expect(result).toEqual({ exitCode: 0 });
  expect(executions).toBe(1);
  expect(executedOptions?.inspection).toBe(inspection);
  expect(executedOptions?.plan).toBe(changePlan);
  expect(executedOptions?.web).toEqual({ alias: 'production' });
  expect(memory.stdout.value).toContain('Execution: release-test');
  expect(memory.stdout.value).toContain('Result: completed');
});

test('--yes cannot bypass a blocked owner plan', async () => {
  let executions = 0;
  const runtime = createRuntime({ ...changePlan, status: 'blocked', steps: [] }, () => {
    executions += 1;
  });
  const memory = createContext('confirmed');

  const result = await handleDeployCliCommand(
    { argv: ['--yes'], context: memory.context },
    runtime,
  );

  expect(result).toEqual({ exitCode: 1 });
  expect(executions).toBe(0);
});

function createRuntime(
  plan: ReleasePlan,
  onExecute: (options: ExecuteProjectReleaseOptions) => void = () => undefined,
): DeployCliRuntime {
  return {
    inspectProjectRelease: (options: InspectProjectReleaseOptions) => {
      expect(options.projectRoot).toBe('/repo');
      return Promise.resolve({ ok: true, inspection });
    },
    createProjectReleasePlan: () => plan,
    executeProjectRelease(options) {
      onExecute(options);
      return Promise.resolve({
        ok: true,
        execution: {
          result: {
            status: 'completed',
            plan: { ...plan, status: 'no-change', steps: [] },
            currentRevision: inspection.desired.revision,
            executedStepIds: plan.steps.map((step) => step.id),
          },
          historyRecorded: true,
        },
      });
    },
    createExecutionId: () => 'release-generated',
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
      writeStdout(text) {
        stdout.value += text;
      },
      writeStderr(text) {
        stderr.value += text;
      },
    },
    stdout,
    stderr,
  };
}
