import { describe, expect, it } from 'bun:test';

import type { DeploymentPlan } from '../domain/DeploymentPlan';
import type { DeploymentPlanStep } from '../domain/DeploymentPlanStep';
import { executeDeploymentPlan } from './executeDeploymentPlan';

const steps: readonly DeploymentPlanStep[] = [
  { id: 'prepare', target: 'web', phase: 'prepare', operation: 'run', reason: 'Prepare web' },
  { id: 'publish', target: 'web', phase: 'publish', operation: 'run', reason: 'Publish web' },
  { id: 'verify', target: 'web', phase: 'verify', operation: 'run', reason: 'Verify web' },
];

function plan(overrides: Partial<DeploymentPlan> = {}): DeploymentPlan {
  return {
    changes: [],
    steps,
    diagnostics: [],
    executable: true,
    ...overrides,
  };
}

describe('executeDeploymentPlan', () => {
  it('does not call the executor for a blocked plan', async () => {
    let calls = 0;
    const result = await executeDeploymentPlan({
      plan: plan({
        executable: false,
        diagnostics: [
          {
            code: 'TARGET_PLANNER_UNAVAILABLE',
            target: 'web',
            message: 'No target planner.',
          },
        ],
      }),
      executeStep: async () => {
        calls += 1;
        return { status: 'completed' };
      },
    });

    expect(calls).toBe(0);
    expect(result.status).toBe('blocked');
  });

  it('completes an empty executable plan without calling the executor', async () => {
    let calls = 0;
    const result = await executeDeploymentPlan({
      plan: plan({ steps: [] }),
      executeStep: async () => {
        calls += 1;
        return { status: 'completed' };
      },
    });

    expect(calls).toBe(0);
    expect(result).toEqual({ status: 'completed', records: [] });
  });

  it('executes completed and skipped steps sequentially', async () => {
    const calls: string[] = [];
    const result = await executeDeploymentPlan({
      plan: plan(),
      executeStep: async (step) => {
        calls.push(step.id);
        return step.id === 'publish'
          ? { status: 'skipped', reason: 'Already published' }
          : { status: 'completed' };
      },
    });

    expect(calls).toEqual(['prepare', 'publish', 'verify']);
    expect(result.status).toBe('completed');
    expect(result.records[1]?.outcome).toEqual({
      status: 'skipped',
      reason: 'Already published',
    });
  });

  it('stops immediately on action-required', async () => {
    const calls: string[] = [];
    const result = await executeDeploymentPlan({
      plan: plan(),
      executeStep: async (step) => {
        calls.push(step.id);
        if (step.id !== 'publish') return { status: 'completed' };
        return {
          status: 'action-required',
          action: {
            type: 'authentication',
            provider: 'example-provider',
            target: 'web',
            code: 'AUTH_REQUIRED',
            message: 'Authenticate with the provider.',
          },
        };
      },
    });

    expect(calls).toEqual(['prepare', 'publish']);
    expect(result.status).toBe('action-required');
    if (result.status === 'action-required') expect(result.action.code).toBe('AUTH_REQUIRED');
  });

  it('stops immediately on a structured failure', async () => {
    const calls: string[] = [];
    const result = await executeDeploymentPlan({
      plan: plan(),
      executeStep: async (step) => {
        calls.push(step.id);
        if (step.id !== 'publish') return { status: 'completed' };
        return {
          status: 'failed',
          error: { code: 'PUBLISH_FAILED', message: 'Publishing failed.', target: 'web' },
        };
      },
    });

    expect(calls).toEqual(['prepare', 'publish']);
    expect(result.status).toBe('failed');
    if (result.status === 'failed') expect(result.failure.code).toBe('PUBLISH_FAILED');
  });

  it('normalizes thrown executor exceptions without leaking their message', async () => {
    const result = await executeDeploymentPlan({
      plan: plan({ steps: [steps[0] as DeploymentPlanStep] }),
      executeStep: async () => {
        throw new Error('secret provider response');
      },
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
});
