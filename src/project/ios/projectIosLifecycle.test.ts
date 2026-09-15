import { promises as fs } from 'node:fs';

import type { DeploymentProviderRegistration } from '@ankhorage/contracts/deploy-provider';
import { expect, test } from 'bun:test';

import { createTempProject, createTestManifest } from '../manifestTestSupport.test';
import { createProjectIosDeploymentPlan } from './createProjectIosDeploymentPlan';
import { executeProjectIosDeploymentWithRuntime } from './executeProjectIosDeployment';
import { inspectProjectIosDeploymentWithRuntime } from './inspectProjectIosDeployment';
import type { ProjectIosDeploymentRuntime } from './ProjectIosDeploymentRuntime';

interface IosTestState {
  fingerprint: string;
  buildCalls: number;
  publishCalls: number;
  deployed: boolean;
}

const INTENT = { buildProfile: 'production', version: '1.2.3' } as const;
const ACCESS = {
  credentials: [{ provider: 'app-store-connect', id: 'publisher', kind: 'api-key' }],
  resolveSecret: () => Promise.resolve('PRIVATE_KEY_SENTINEL'),
} as const;

function createRuntime(state: IosTestState): ProjectIosDeploymentRuntime {
  return {
    providers: [createBuildProvider(state), createPublishProvider(state)],
    now: () => new Date('2026-08-12T20:00:00.000Z'),
  };
}

function createBuildProvider(state: IosTestState): DeploymentProviderRegistration {
  return {
    descriptor: {
      id: 'eas',
      packageName: '@ankhorage/deploy-provider-eas',
      displayName: 'EAS',
      capabilities: [{ id: 'ios-build', targets: ['ios'] }],
    },
    iosBuilder: {
      inspectAsync: () =>
        Promise.resolve({ status: 'completed', value: { fingerprint: state.fingerprint } }),
      buildAsync: (request) => {
        state.buildCalls += 1;
        return Promise.resolve({
          status: 'completed',
          value: {
            provider: 'eas',
            buildId: 'ios-build-1',
            buildProfile: request.buildProfile,
            fingerprint: request.expectedFingerprint,
            version: request.version,
            buildNumber: '42',
            archiveUrl: 'https://example.test/app.ipa',
          },
        });
      },
    },
  };
}

function createPublishProvider(state: IosTestState): DeploymentProviderRegistration {
  return {
    descriptor: {
      id: 'app-store-connect',
      packageName: '@ankhorage/deploy-provider-app-store-connect',
      displayName: 'App Store Connect',
      capabilities: [{ id: 'ios-publish', targets: ['ios'] }],
    },
    iosPublisher: {
      inspectAsync: (request) =>
        Promise.resolve({
          status: 'completed',
          value: {
            bundleIdentifier: request.bundleIdentifier,
            version: state.deployed ? request.version : null,
            buildNumber: state.deployed ? '42' : null,
          },
        }),
      publishAsync: (request) => {
        state.publishCalls += 1;
        state.deployed = true;
        return Promise.resolve({
          status: 'completed',
          value: {
            target: 'ios',
            revision: request.revision,
            buildProvider: request.artifact.provider,
            publishProvider: 'app-store-connect',
            buildId: request.artifact.buildId,
            version: request.version,
            buildNumber: request.artifact.buildNumber,
          },
        });
      },
      verifyAsync: (request) =>
        Promise.resolve({
          status: 'completed',
          value: {
            bundleIdentifier: request.bundleIdentifier,
            version: request.version,
            buildNumber: state.deployed ? request.artifact.buildNumber : null,
          },
        }),
    },
  };
}

test('project iOS lifecycle builds publishes verifies records history then becomes no-change', async () => {
  const projectRoot = await createIosProject();
  const state = { fingerprint: 'a'.repeat(40), buildCalls: 0, publishCalls: 0, deployed: false };
  const runtime = createRuntime(state);
  try {
    const inspected = await inspectProjectIosDeploymentWithRuntime(
      { projectRoot, intent: INTENT, ...ACCESS },
      runtime,
    );
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;
    const plan = createProjectIosDeploymentPlan(inspected.inspection);
    expect(plan.steps.map((step) => step.id)).toEqual([
      'ios:prepare',
      'ios:build',
      'ios:publish',
      'ios:verify',
    ]);
    const deployed = await executeProjectIosDeploymentWithRuntime(
      { inspection: inspected.inspection, plan, ...ACCESS },
      runtime,
    );
    expect(deployed.execution.status).toBe('completed');
    expect(deployed.verification).toEqual({ ok: true });
    expect(deployed.historyRecorded).toBe(true);
    expect(state.buildCalls).toBe(1);
    expect(state.publishCalls).toBe(1);

    const second = await inspectProjectIosDeploymentWithRuntime(
      { projectRoot, intent: INTENT, ...ACCESS },
      runtime,
    );
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    const secondPlan = createProjectIosDeploymentPlan(second.inspection);
    expect(secondPlan.steps).toEqual([]);
    const noChange = await executeProjectIosDeploymentWithRuntime(
      { inspection: second.inspection, plan: secondPlan, ...ACCESS },
      runtime,
    );
    expect(noChange.execution.status).toBe('completed');
    expect(state.buildCalls).toBe(1);
    expect(state.publishCalls).toBe(1);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('project iOS execution rejects source drift before build or publish mutation', async () => {
  const projectRoot = await createIosProject();
  const state = { fingerprint: 'b'.repeat(40), buildCalls: 0, publishCalls: 0, deployed: false };
  const runtime = createRuntime(state);
  try {
    const inspected = await inspectProjectIosDeploymentWithRuntime(
      { projectRoot, intent: INTENT, ...ACCESS },
      runtime,
    );
    if (!inspected.ok) throw new Error('inspection failed');
    const plan = createProjectIosDeploymentPlan(inspected.inspection);
    state.fingerprint = 'c'.repeat(40);
    const result = await executeProjectIosDeploymentWithRuntime(
      { inspection: inspected.inspection, plan, ...ACCESS },
      runtime,
    );
    expect(result.execution.status).toBe('failed');
    if (result.execution.status === 'failed') {
      expect(result.execution.failure.code).toBe('IOS_SOURCE_CHANGED_AFTER_PLAN');
    }
    expect(state.buildCalls).toBe(0);
    expect(state.publishCalls).toBe(0);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

function createIosProject(): Promise<string> {
  return createTempProject(
    createTestManifest({
      targets: { ios: { enabled: true, bundleIdentifier: 'com.example.app' } },
    }),
  );
}
