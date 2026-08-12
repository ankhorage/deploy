import { describe, expect, it } from 'bun:test';

import type { AppDeployManifest, AppDeployTargetId } from '@ankhorage/contracts/deploy';

import type { DeploymentPlanStep } from '../domain/DeploymentPlanStep';
import type { DeploymentTargetPlanContributor } from '../domain/DeploymentTargetPlanContributor';
import { createDeploymentPlan } from './createDeploymentPlan';

const allDesired: AppDeployManifest = {
  targets: {
    web: { enabled: true },
    android: { enabled: true, package: 'com.example.app' },
    ios: { enabled: true, bundleIdentifier: 'com.example.app' },
  },
};

function step(target: AppDeployTargetId, id: string, phase: DeploymentPlanStep['phase'] = 'build') {
  return { id, target, phase, operation: 'run', reason: `Run ${phase}` } as const;
}

function contributor(
  target: AppDeployTargetId,
  createSteps: DeploymentTargetPlanContributor['createSteps'],
  capabilities: DeploymentTargetPlanContributor['capabilities'] = ['build'],
): DeploymentTargetPlanContributor {
  return { target, capabilities, createSteps };
}

describe('createDeploymentPlan', () => {
  it('invokes contributors in canonical target order', () => {
    const calls: AppDeployTargetId[] = [];
    const plan = createDeploymentPlan({
      desired: allDesired,
      current: { targets: {} },
      contributors: {
        ios: contributor('ios', (change) => {
          calls.push(change.target);
          return [step('ios', 'ios-build')];
        }),
        android: contributor('android', (change) => {
          calls.push(change.target);
          return [step('android', 'android-build')];
        }),
        web: contributor('web', (change) => {
          calls.push(change.target);
          return [step('web', 'web-build')];
        }),
      },
    });

    expect(calls).toEqual(['web', 'android', 'ios']);
    expect(plan.steps.map(({ id }) => id)).toEqual(['web-build', 'android-build', 'ios-build']);
    expect(plan.executable).toBe(true);
  });

  it('makes an actionable change non-executable when its target planner is missing', () => {
    const desired: AppDeployManifest = { targets: { web: { enabled: true } } };

    const plan = createDeploymentPlan({ desired, current: { targets: {} }, contributors: {} });

    expect(plan.executable).toBe(false);
    expect(plan.diagnostics).toEqual([
      {
        code: 'TARGET_PLANNER_UNAVAILABLE',
        target: 'web',
        message: 'No target planner is registered for an actionable deployment change.',
      },
    ]);
  });

  it('does not require contributors for no-change targets', () => {
    const desired: AppDeployManifest = { targets: { web: { enabled: false } } };

    const plan = createDeploymentPlan({ desired, current: { targets: {} }, contributors: {} });

    expect(plan.executable).toBe(true);
    expect(plan.steps).toEqual([]);
    expect(plan.diagnostics).toEqual([]);
  });

  it('rejects a contributor registered under a different declared target', () => {
    const desired: AppDeployManifest = { targets: { web: { enabled: true } } };

    const plan = createDeploymentPlan({
      desired,
      current: { targets: {} },
      contributors: { web: contributor('android', () => []) },
    });

    expect(plan.executable).toBe(false);
    expect(plan.diagnostics[0]?.code).toBe('CONTRIBUTOR_TARGET_MISMATCH');
  });

  it('rejects steps that claim another target or undeclared capability', () => {
    const desired: AppDeployManifest = { targets: { web: { enabled: true } } };

    const wrongTarget = createDeploymentPlan({
      desired,
      current: { targets: {} },
      contributors: { web: contributor('web', () => [step('android', 'wrong-target')]) },
    });
    const wrongCapability = createDeploymentPlan({
      desired,
      current: { targets: {} },
      contributors: {
        web: contributor('web', () => [step('web', 'publish', 'publish')], ['build']),
      },
    });

    expect(wrongTarget.diagnostics[0]?.code).toBe('STEP_TARGET_MISMATCH');
    expect(wrongCapability.diagnostics[0]?.code).toBe('UNDECLARED_CAPABILITY');
  });

  it('rejects duplicate global step IDs', () => {
    const desired: AppDeployManifest = {
      targets: {
        web: { enabled: true },
        android: { enabled: true, package: 'com.example.app' },
      },
    };

    const plan = createDeploymentPlan({
      desired,
      current: { targets: {} },
      contributors: {
        web: contributor('web', () => [step('web', 'build')]),
        android: contributor('android', () => [step('android', 'build')]),
      },
    });

    expect(plan.executable).toBe(false);
    expect(plan.steps).toHaveLength(1);
    expect(plan.diagnostics[0]?.code).toBe('DUPLICATE_STEP_ID');
  });

  it('normalizes contributor exceptions into plan diagnostics', () => {
    const desired: AppDeployManifest = { targets: { web: { enabled: true } } };

    const plan = createDeploymentPlan({
      desired,
      current: { targets: {} },
      contributors: {
        web: contributor('web', () => {
          throw new Error('provider secret should not leak');
        }),
      },
    });

    expect(plan.executable).toBe(false);
    expect(plan.diagnostics[0]).toEqual({
      code: 'TARGET_PLANNER_FAILED',
      target: 'web',
      message: 'The target planner failed while creating deployment steps.',
    });
    expect(JSON.stringify(plan)).not.toContain('provider secret');
  });

  it('creates structurally identical plans for identical inputs', () => {
    const input = {
      desired: { targets: { web: { enabled: true } } } satisfies AppDeployManifest,
      current: { targets: {} },
      contributors: { web: contributor('web', () => [step('web', 'stable-build')]) },
    };

    expect(createDeploymentPlan(input)).toEqual(createDeploymentPlan(input));
  });
});
