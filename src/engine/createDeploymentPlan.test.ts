import type { AppDeployManifest, AppDeployTargetId } from '@ankhorage/contracts/deploy';
import { expect, test } from 'bun:test';

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

function step(
  target: AppDeployTargetId,
  id: string,
  phase: DeploymentPlanStep['phase'] = 'build',
): DeploymentPlanStep {
  return { id, target, phase, operation: 'run', reason: `Run ${phase}` };
}

function contributor(
  target: AppDeployTargetId,
  createSteps: DeploymentTargetPlanContributor['createSteps'],
  capabilities: DeploymentTargetPlanContributor['capabilities'] = ['build'],
): DeploymentTargetPlanContributor {
  return { target, capabilities, createSteps };
}

test('deployment planning invokes contributors in canonical target order', () => {
  const calls: AppDeployTargetId[] = [];
  const record = (target: AppDeployTargetId) => {
    calls.push(target);
    return [step(target, `${target}-build`)];
  };
  const plan = createDeploymentPlan({
    desired: allDesired,
    current: { targets: {} },
    contributors: {
      ios: contributor('ios', () => record('ios')),
      android: contributor('android', () => record('android')),
      web: contributor('web', () => record('web')),
    },
  });

  expect(calls).toEqual(['web', 'android', 'ios']);
  expect(plan.steps.map(({ id }) => id)).toEqual(['web-build', 'android-build', 'ios-build']);
  expect(plan.executable).toBe(true);
});

test('missing planner blocks actionable deployment changes', () => {
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

test('no-change targets do not require plan contributors', () => {
  const desired: AppDeployManifest = { targets: { web: { enabled: false } } };
  const plan = createDeploymentPlan({ desired, current: { targets: {} }, contributors: {} });

  expect(plan.executable).toBe(true);
  expect(plan.steps).toEqual([]);
  expect(plan.diagnostics).toEqual([]);
});

test('planner rejects a contributor declaring another target', () => {
  const desired: AppDeployManifest = { targets: { web: { enabled: true } } };
  const plan = createDeploymentPlan({
    desired,
    current: { targets: {} },
    contributors: { web: contributor('android', () => []) },
  });

  expect(plan.executable).toBe(false);
  expect(plan.diagnostics[0]?.code).toBe('CONTRIBUTOR_TARGET_MISMATCH');
});

test('planner rejects a step claiming another target', () => {
  const desired: AppDeployManifest = { targets: { web: { enabled: true } } };
  const plan = createDeploymentPlan({
    desired,
    current: { targets: {} },
    contributors: { web: contributor('web', () => [step('android', 'wrong-target')]) },
  });

  expect(plan.executable).toBe(false);
  expect(plan.diagnostics[0]?.code).toBe('STEP_TARGET_MISMATCH');
});

test('planner rejects a step using an undeclared capability', () => {
  const desired: AppDeployManifest = { targets: { web: { enabled: true } } };
  const plan = createDeploymentPlan({
    desired,
    current: { targets: {} },
    contributors: {
      web: contributor('web', () => [step('web', 'publish', 'publish')], ['build']),
    },
  });

  expect(plan.executable).toBe(false);
  expect(plan.diagnostics[0]?.code).toBe('UNDECLARED_CAPABILITY');
});

test('planner rejects duplicate global step IDs', () => {
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

test('planner normalizes contributor exceptions without leaking messages', () => {
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
  expect(plan.diagnostics[0]?.code).toBe('TARGET_PLANNER_FAILED');
  expect(JSON.stringify(plan)).not.toContain('provider secret');
});

test('identical planning inputs create structurally identical plans', () => {
  const input = {
    desired: { targets: { web: { enabled: true } } } satisfies AppDeployManifest,
    current: { targets: {} },
    contributors: { web: contributor('web', () => [step('web', 'stable-build')]) },
  };

  expect(createDeploymentPlan(input)).toEqual(createDeploymentPlan(input));
});
