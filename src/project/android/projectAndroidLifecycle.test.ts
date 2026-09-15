import { promises as fs } from 'node:fs';

import type { DeploymentProviderRegistration } from '@ankhorage/contracts/deploy-provider';
import { expect, test } from 'bun:test';

import { createTempProject, createTestManifest } from '../manifestTestSupport.test';
import { createProjectAndroidDeploymentPlan } from './createProjectAndroidDeploymentPlan';
import { executeProjectAndroidDeploymentWithRuntime } from './executeProjectAndroidDeployment';
import { inspectProjectAndroidDeploymentWithRuntime } from './inspectProjectAndroidDeployment';
import type { ProjectAndroidDeploymentRuntime } from './ProjectAndroidDeploymentRuntime';

interface AndroidTestState {
  fingerprint: string;
  buildCalls: number;
  publishCalls: number;
  deployed: boolean;
}

const INTENT = {
  buildProfile: 'production',
  track: 'internal',
  releaseStatus: 'completed',
} as const;
const ACCESS = {
  credentials: [{ provider: 'google-play', id: 'publisher', kind: 'service-account' }],
  resolveSecret: () => Promise.resolve('PRIVATE_KEY_SENTINEL'),
} as const;

function createRuntime(state: AndroidTestState): ProjectAndroidDeploymentRuntime {
  return {
    providers: [createBuildProvider(state), createPublishProvider(state)],
    now: () => new Date('2026-08-12T20:00:00.000Z'),
  };
}

function createBuildProvider(state: AndroidTestState): DeploymentProviderRegistration {
  return {
    descriptor: {
      id: 'eas',
      packageName: '@ankhorage/deploy-provider-eas',
      displayName: 'EAS',
      capabilities: [{ id: 'android-build', targets: ['android'] }],
    },
    androidBuilder: {
      inspectAsync: () =>
        Promise.resolve({ status: 'completed', value: { fingerprint: state.fingerprint } }),
      buildAsync: (request) => {
        state.buildCalls += 1;
        return Promise.resolve({
          status: 'completed',
          value: {
            provider: 'eas',
            buildId: 'android-build-1',
            buildProfile: request.buildProfile,
            fingerprint: request.expectedFingerprint,
            versionCode: 42,
            archiveUrl: 'https://example.test/app.aab',
          },
        });
      },
    },
  };
}

function createPublishProvider(state: AndroidTestState): DeploymentProviderRegistration {
  return {
    descriptor: {
      id: 'google-play',
      packageName: '@ankhorage/deploy-provider-google-play',
      displayName: 'Google Play',
      capabilities: [{ id: 'android-publish', targets: ['android'] }],
    },
    androidPublisher: {
      inspectAsync: (request) =>
        Promise.resolve({
          status: 'completed',
          value: {
            track: request.track,
            activeVersionCodes: state.deployed ? [42] : [],
          },
        }),
      publishAsync: (request) => {
        state.publishCalls += 1;
        state.deployed = true;
        return Promise.resolve({
          status: 'completed',
          value: {
            target: 'android',
            revision: request.revision,
            buildProvider: request.artifact.provider,
            publishProvider: 'google-play',
            buildId: request.artifact.buildId,
            versionCode: request.artifact.versionCode,
            track: request.track,
            releaseStatus: request.releaseStatus,
          },
        });
      },
      verifyAsync: (request) =>
        Promise.resolve({
          status: 'completed',
          value: {
            track: request.track,
            activeVersionCodes: state.deployed ? [request.artifact.versionCode] : [],
          },
        }),
    },
  };
}

test('project Android lifecycle builds publishes verifies records history then becomes no-change', async () => {
  const projectRoot = await createAndroidProject();
  const state = { fingerprint: 'a'.repeat(40), buildCalls: 0, publishCalls: 0, deployed: false };
  const runtime = createRuntime(state);
  try {
    const inspected = await inspectProjectAndroidDeploymentWithRuntime(
      { projectRoot, intent: INTENT, ...ACCESS },
      runtime,
    );
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;
    const plan = createProjectAndroidDeploymentPlan(inspected.inspection);
    expect(plan.steps.map((step) => step.id)).toEqual([
      'android:prepare',
      'android:build',
      'android:publish',
      'android:verify',
    ]);
    const deployed = await executeProjectAndroidDeploymentWithRuntime(
      { inspection: inspected.inspection, plan, ...ACCESS },
      runtime,
    );
    expect(deployed.execution.status).toBe('completed');
    expect(deployed.verification).toEqual({ ok: true });
    expect(deployed.historyRecorded).toBe(true);
    expect(state.buildCalls).toBe(1);
    expect(state.publishCalls).toBe(1);

    const second = await inspectProjectAndroidDeploymentWithRuntime(
      { projectRoot, intent: INTENT, ...ACCESS },
      runtime,
    );
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    const secondPlan = createProjectAndroidDeploymentPlan(second.inspection);
    expect(secondPlan.steps).toEqual([]);
    const noChange = await executeProjectAndroidDeploymentWithRuntime(
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

test('project Android execution rejects source drift before build or publish mutation', async () => {
  const projectRoot = await createAndroidProject();
  const state = { fingerprint: 'b'.repeat(40), buildCalls: 0, publishCalls: 0, deployed: false };
  const runtime = createRuntime(state);
  try {
    const inspected = await inspectProjectAndroidDeploymentWithRuntime(
      { projectRoot, intent: INTENT, ...ACCESS },
      runtime,
    );
    if (!inspected.ok) throw new Error('inspection failed');
    const plan = createProjectAndroidDeploymentPlan(inspected.inspection);
    state.fingerprint = 'c'.repeat(40);
    const result = await executeProjectAndroidDeploymentWithRuntime(
      { inspection: inspected.inspection, plan, ...ACCESS },
      runtime,
    );
    expect(result.execution.status).toBe('failed');
    if (result.execution.status === 'failed') {
      expect(result.execution.failure.code).toBe('ANDROID_SOURCE_CHANGED_AFTER_PLAN');
    }
    expect(state.buildCalls).toBe(0);
    expect(state.publishCalls).toBe(0);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

function createAndroidProject(): Promise<string> {
  return createTempProject(
    createTestManifest({
      targets: { android: { enabled: true, package: 'com.example.app' } },
    }),
  );
}
