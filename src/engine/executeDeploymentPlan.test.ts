import { expect, test } from 'bun:test';

import type { DeploymentPlan } from '../domain/DeploymentPlan';
import type { DeploymentPlanStep } from '../domain/DeploymentPlanStep';
import type { DeploymentStepExecutor } from './executeDeploymentPlan';
import { executeDeploymentPlan } from './executeDeploymentPlan';

const prepareStep: DeploymentPlanStep = {
  id: 'prepare',
  target: 'web',
  phase: 'prepare',
  operation: 'run',
  reason: 'Prepare web',
};
const publishStep: DeploymentPlanStep = {
  id: 'publish',
  target: 'web',
  phase: 'publish',
  operation: 'run',
  reason: 'Publish web',
};
const verifyStep: DeploymentPlanStep = {
  id: 'verify',
  target: 'web',
  phase: 'verify',
  operation: 'run',
  reason: 'Verify web',
};
const steps = [prepareStep, publishStep, verifyStep] as const;

function plan(overrides: Partial<DeploymentPlan> = {}): DeploymentPlan {
  return { changes: [], steps, diagnostics: [], executable: true, ...overrides };
}

test('blocked plans never invoke the step executor', async () => {
  let calls = 0;
  const executeStep: DeploymentStepExecutor = () => {
    calls += 1;
    return Promise.resolve({ status: 'completed' });
  };
  const result = await executeDeploymentPlan({
    plan: plan({
      executable: false,
      diagnostics: [
        { code: 'TARGET_PLANNER_UNAVAILABLE', target: 'web', message: 'No target planner.' },
      ],
    }),
    executeStep,
  });

  expect(calls).toBe(0);
  expect(result.status).toBe('blocked');
});

test('empty executable plans complete without invoking the executor', async () => {
  let calls = 0;
  const executeStep: DeploymentStepExecutor = () => {
    calls += 1;
    return Promise.resolve({ status: 'completed' });
  };
  const result = await executeDeploymentPlan({ plan: plan({ steps: [] }), executeStep });

  expect(calls).toBe(0);
  expect(result).toEqual({ status: 'completed', records: [] });
});

test('completed and skipped plan steps execute sequentially', async () => {
  const calls: string[] = [];
  const executeStep: DeploymentStepExecutor = (step) => {
    calls.push(step.id);
    return Promise.resolve(
      step.id === 'publish'
        ? { status: 'skipped', reason: 'Already published' }
        : { status: 'completed' },
    );
  };
  const result = await executeDeploymentPlan({ plan: plan(), executeStep });

  expect(calls).toEqual(['prepare', 'publish', 'verify']);
  expect(result.status).toBe('completed');
  expect(result.records[1]?.outcome).toEqual({ status: 'skipped', reason: 'Already published' });
});

test('execution stops immediately on action-required', async () => {
  const calls: string[] = [];
  const executeStep: DeploymentStepExecutor = (step) => {
    calls.push(step.id);
    if (step.id !== 'publish') return Promise.resolve({ status: 'completed' });
    return Promise.resolve({
      status: 'action-required',
      action: {
        type: 'authentication',
        provider: 'example-provider',
        target: 'web',
        code: 'AUTH_REQUIRED',
        message: 'Authenticate with the provider.',
      },
    });
  };
  const result = await executeDeploymentPlan({ plan: plan(), executeStep });

  expect(calls).toEqual(['prepare', 'publish']);
  expect(result.status).toBe('action-required');
  if (result.status === 'action-required') expect(result.action.code).toBe('AUTH_REQUIRED');
});

test('execution stops immediately on a structured failure', async () => {
  const calls: string[] = [];
  const executeStep: DeploymentStepExecutor = (step) => {
    calls.push(step.id);
    if (step.id !== 'publish') return Promise.resolve({ status: 'completed' });
    return Promise.resolve({
      status: 'failed',
      error: { code: 'PUBLISH_FAILED', message: 'Publishing failed.', target: 'web' },
    });
  };
  const result = await executeDeploymentPlan({ plan: plan(), executeStep });

  expect(calls).toEqual(['prepare', 'publish']);
  expect(result.status).toBe('failed');
  if (result.status === 'failed') expect(result.failure.code).toBe('PUBLISH_FAILED');
});

test('thrown executor errors are normalized without leaking their message', async () => {
  const executeStep: DeploymentStepExecutor = () =>
    Promise.reject(new Error('secret provider response'));
  const result = await executeDeploymentPlan({
    plan: plan({ steps: [prepareStep] }),
    executeStep,
  });

  expect(result.status).toBe('failed');
  expect(JSON.stringify(result)).not.toContain('secret provider response');
  if (result.status === 'failed') {
    expect(result.failure).toEqual({
      code: 'STEP_EXECUTOR_THROWN',
      message: 'Deployment step executor threw an exception.',
      target: 'web',
    });
  }
});
