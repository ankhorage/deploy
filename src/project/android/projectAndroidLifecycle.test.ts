import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import type { DeploymentProcessRunner } from '../../runtime/process/DeploymentProcessRunner';
import type { GooglePlayTransport } from '../../providers/googlePlay/GooglePlayTransport';
import { createTempProject, createTestManifest } from '../manifestTestSupport.test';
import { createProjectAndroidDeploymentPlan } from './createProjectAndroidDeploymentPlan';
import { executeProjectAndroidDeploymentWithRuntime } from './executeProjectAndroidDeployment';
import { inspectProjectAndroidDeploymentWithRuntime } from './inspectProjectAndroidDeployment';
import type { ProjectAndroidDeploymentRuntime } from './ProjectAndroidDeploymentRuntime';

interface AndroidTestState {
  fingerprint: string;
  buildCalls: number;
  playMutations: number;
  deployed: boolean;
}

const INTENT = { buildProfile: 'production', track: 'internal', releaseStatus: 'completed' } as const;

function createRuntime(state: AndroidTestState): ProjectAndroidDeploymentRuntime {
  return {
    runProcess: createProcessRunner(state),
    createGooglePlayToken: () => Promise.resolve('google-token'),
    requestGooglePlay: createGooglePlayTransport(state),
    downloadArchive: async () => {
      const directory = await fs.mkdtemp(path.join(tmpdir(), 'android-lifecycle-'));
      const filePath = path.join(directory, 'application.aab');
      await fs.writeFile(filePath, 'bundle');
      return { directory, filePath };
    },
    now: () => new Date('2026-08-12T20:00:00.000Z'),
  };
}

function createProcessRunner(state: AndroidTestState): DeploymentProcessRunner {
  return (request) => {
    if (request.command === 'node') {
      return Promise.resolve({ exitCode: 0, stdout: JSON.stringify({ hash: state.fingerprint }), stderr: '' });
    }
    const command = request.args[0];
    if (command === 'config') return Promise.resolve(configResult());
    if (command === 'build') {
      state.buildCalls += 1;
      return Promise.resolve(buildResult(state.fingerprint));
    }
    return Promise.resolve({ exitCode: 0, stdout: '', stderr: '' });
  };
}

function configResult() {
  return {
    exitCode: 0,
    stdout: JSON.stringify({
      buildProfile: {},
      appConfig: { android: { package: 'com.example.app' } },
    }),
    stderr: '',
  };
}

function buildResult(fingerprint: string) {
  return {
    exitCode: 0,
    stdout: JSON.stringify([
      {
        id: 'android-build-1',
        status: 'FINISHED',
        platform: 'ANDROID',
        buildProfile: 'production',
        appBuildVersion: '42',
        fingerprint: { hash: fingerprint },
        artifacts: { applicationArchiveUrl: 'https://example.test/app.aab' },
      },
    ]),
    stderr: '',
  };
}

function createGooglePlayTransport(state: AndroidTestState): GooglePlayTransport {
  return (request) => {
    if (request.method === 'GET') {
      return Promise.resolve({ status: 200, body: releaseState(state.deployed) });
    }
    state.playMutations += 1;
    if (request.url.endsWith('/edits')) {
      return Promise.resolve({ status: 200, body: '{"id":"edit-1"}' });
    }
    if (request.url.includes('/bundles')) {
      return Promise.resolve({ status: 200, body: '{"versionCode":42}' });
    }
    if (request.url.endsWith(':commit')) state.deployed = true;
    return Promise.resolve({ status: 200, body: '{}' });
  };
}

function releaseState(deployed: boolean): string {
  return JSON.stringify({
    releases: deployed
      ? [
          {
            releaseLifecycleState: 'RELEASE_LIFECYCLE_STATE_IN_REVIEW',
            activeArtifacts: [{ versionCode: 42 }],
          },
        ]
      : [],
  });
}

test('project Android lifecycle builds publishes verifies records history then becomes no-change', async () => {
  const projectRoot = await createAndroidProject();
  const state = { fingerprint: 'a'.repeat(40), buildCalls: 0, playMutations: 0, deployed: false };
  const runtime = createRuntime(state);
  try {
    const inspected = await inspectProjectAndroidDeploymentWithRuntime({ projectRoot, intent: INTENT }, runtime);
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;
    const plan = createProjectAndroidDeploymentPlan(inspected.inspection);
    expect(plan.steps.map((step) => step.id)).toEqual([
      'android:prepare', 'android:build', 'android:publish', 'android:verify',
    ]);
    const deployed = await executeProjectAndroidDeploymentWithRuntime(
      { inspection: inspected.inspection, plan }, runtime,
    );
    expect(deployed.execution.status).toBe('completed');
    expect(deployed.verification).toEqual({ ok: true });
    expect(deployed.historyRecorded).toBe(true);
    expect(state.buildCalls).toBe(1);
    expect(state.playMutations).toBe(4);

    const second = await inspectProjectAndroidDeploymentWithRuntime({ projectRoot, intent: INTENT }, runtime);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    const secondPlan = createProjectAndroidDeploymentPlan(second.inspection);
    expect(secondPlan.steps).toEqual([]);
    const noChange = await executeProjectAndroidDeploymentWithRuntime(
      { inspection: second.inspection, plan: secondPlan }, runtime,
    );
    expect(noChange.execution.status).toBe('completed');
    expect(state.buildCalls).toBe(1);
    expect(state.playMutations).toBe(4);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('project Android execution rejects source drift before build or Play mutation', async () => {
  const projectRoot = await createAndroidProject();
  const state = { fingerprint: 'b'.repeat(40), buildCalls: 0, playMutations: 0, deployed: false };
  const runtime = createRuntime(state);
  try {
    const inspected = await inspectProjectAndroidDeploymentWithRuntime({ projectRoot, intent: INTENT }, runtime);
    if (!inspected.ok) throw new Error('inspection failed');
    const plan = createProjectAndroidDeploymentPlan(inspected.inspection);
    state.fingerprint = 'c'.repeat(40);
    const result = await executeProjectAndroidDeploymentWithRuntime(
      { inspection: inspected.inspection, plan }, runtime,
    );
    expect(result.execution.status).toBe('failed');
    if (result.execution.status === 'failed') {
      expect(result.execution.failure.code).toBe('ANDROID_SOURCE_CHANGED_AFTER_PLAN');
    }
    expect(state.buildCalls).toBe(0);
    expect(state.playMutations).toBe(0);
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
