import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import type { AppStoreConnectTransport } from '../../providers/appStoreConnect/AppStoreConnectTransport';
import type { DeploymentProcessRunner } from '../../runtime/process/DeploymentProcessRunner';
import { createTempProject, createTestManifest } from '../manifestTestSupport.test';
import { createProjectIosDeploymentPlan } from './createProjectIosDeploymentPlan';
import { executeProjectIosDeploymentWithRuntime } from './executeProjectIosDeployment';
import { inspectProjectIosDeploymentWithRuntime } from './inspectProjectIosDeployment';
import type { ProjectIosDeploymentRuntime } from './ProjectIosDeploymentRuntime';

interface IosTestState {
  fingerprint: string;
  buildCalls: number;
  appStoreMutations: number;
  uploadCalls: number;
  deployed: boolean;
}

const INTENT = { buildProfile: 'production', version: '1.2.3' } as const;
const ACCESS = {
  credentials: [{ provider: 'app-store-connect', id: 'publisher', kind: 'api-key' }],
  resolveSecret: () =>
    Promise.resolve(JSON.stringify({ keyId: 'key', issuerId: 'issuer', privateKey: 'PRIVATE_KEY' })),
} as const;

function createRuntime(state: IosTestState): ProjectIosDeploymentRuntime {
  return {
    runProcess: createProcessRunner(state),
    createAppStoreConnectToken: () => Promise.resolve('apple-token'),
    requestAppStoreConnect: createAppStoreConnectTransport(state),
    uploadAppStore: () => {
      state.uploadCalls += 1;
      return Promise.resolve({ status: 200 });
    },
    downloadArchive: async () => {
      const directory = await fs.mkdtemp(path.join(tmpdir(), 'ios-lifecycle-'));
      const filePath = path.join(directory, 'application.ipa');
      await fs.writeFile(filePath, 'ipa');
      return { directory, filePath };
    },
    readArchive: (filePath) => fs.readFile(filePath),
    cleanupArchive: (directory) => fs.rm(directory, { recursive: true, force: true }),
    waitForAppStoreProcessing: () => Promise.resolve(),
    maxAppStoreProcessingAttempts: 2,
    now: () => new Date('2026-08-12T20:00:00.000Z'),
  };
}

function createProcessRunner(state: IosTestState): DeploymentProcessRunner {
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
    stdout: JSON.stringify({ buildProfile: {}, appConfig: { ios: { bundleIdentifier: 'com.example.app' } } }),
    stderr: '',
  };
}

function buildResult(fingerprint: string) {
  return {
    exitCode: 0,
    stdout: JSON.stringify([{
      id: 'ios-build-1',
      status: 'FINISHED',
      platform: 'IOS',
      buildProfile: 'production',
      appVersion: '1.2.3',
      appBuildVersion: '42',
      fingerprint: { hash: fingerprint },
      artifacts: { applicationArchiveUrl: 'https://example.test/app.ipa' },
    }]),
    stderr: '',
  };
}

function createAppStoreConnectTransport(state: IosTestState): AppStoreConnectTransport {
  return (request) => {
    if (request.method === 'GET' && request.url.includes('/apps?')) {
      return Promise.resolve({ status: 200, body: appState() });
    }
    if (request.method === 'GET' && request.url.includes('/appStoreVersions?')) {
      return Promise.resolve({ status: 200, body: versionState(state.deployed) });
    }
    if (request.method === 'GET' && request.url.includes('/buildUploads/')) {
      return Promise.resolve({ status: 200, body: completedBuildUpload() });
    }
    if (request.method === 'GET' && request.url.includes('/appStoreVersions/version-id/build')) {
      return Promise.resolve({ status: 200, body: attachedBuild() });
    }
    state.appStoreMutations += 1;
    if (request.method === 'POST' && request.url.endsWith('/buildUploads')) {
      return Promise.resolve({ status: 201, body: resource('buildUploads', 'upload-id') });
    }
    if (request.method === 'POST' && request.url.endsWith('/buildUploadFiles')) {
      return Promise.resolve({ status: 201, body: uploadReservation() });
    }
    if (request.method === 'POST' && request.url.endsWith('/appStoreVersions')) {
      return Promise.resolve({ status: 201, body: createdVersion() });
    }
    if (request.url.includes('/relationships/build')) state.deployed = true;
    return Promise.resolve({ status: 204, body: '' });
  };
}

function appState(): string {
  return JSON.stringify({ data: [{ type: 'apps', id: 'app-id', attributes: { bundleId: 'com.example.app' } }] });
}

function versionState(deployed: boolean): string {
  return deployed
    ? JSON.stringify({
        data: [{
          type: 'appStoreVersions',
          id: 'version-id',
          attributes: { platform: 'IOS', versionString: '1.2.3' },
          relationships: { build: { data: { type: 'builds', id: 'apple-build-id' } } },
        }],
        included: [{
          type: 'builds',
          id: 'apple-build-id',
          attributes: { version: '42', processingState: 'VALID' },
        }],
      })
    : JSON.stringify({ data: [] });
}

function completedBuildUpload(): string {
  return JSON.stringify({
    data: { type: 'buildUploads', id: 'upload-id', attributes: { state: { state: 'COMPLETE' } } },
    included: [{
      type: 'builds',
      id: 'apple-build-id',
      attributes: { version: '42', processingState: 'VALID' },
    }],
  });
}

function attachedBuild(): string {
  return JSON.stringify({
    data: { type: 'builds', id: 'apple-build-id', attributes: { version: '42', processingState: 'VALID' } },
  });
}

function uploadReservation(): string {
  return JSON.stringify({
    data: {
      type: 'buildUploadFiles',
      id: 'file-id',
      attributes: {
        uti: 'com.apple.ipa',
        uploadOperations: [{
          offset: 0,
          length: 3,
          method: 'PUT',
          url: 'https://upload.example.test/part',
          requestHeaders: [],
        }],
      },
    },
  });
}

function resource(type: string, id: string): string {
  return JSON.stringify({ data: { type, id } });
}

function createdVersion(): string {
  return JSON.stringify({
    data: {
      type: 'appStoreVersions',
      id: 'version-id',
      attributes: { platform: 'IOS', versionString: '1.2.3' },
    },
  });
}

test('project iOS lifecycle builds publishes verifies records history then becomes no-change', async () => {
  const projectRoot = await createIosProject();
  const state = { fingerprint: 'a'.repeat(40), buildCalls: 0, appStoreMutations: 0, uploadCalls: 0, deployed: false };
  const runtime = createRuntime(state);
  try {
    const inspected = await inspectProjectIosDeploymentWithRuntime({ projectRoot, intent: INTENT, ...ACCESS }, runtime);
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;
    const plan = createProjectIosDeploymentPlan(inspected.inspection);
    expect(plan.steps.map((step) => step.id)).toEqual(['ios:prepare', 'ios:build', 'ios:publish', 'ios:verify']);
    const deployed = await executeProjectIosDeploymentWithRuntime(
      { inspection: inspected.inspection, plan, ...ACCESS },
      runtime,
    );
    expect(deployed.execution.status).toBe('completed');
    expect(deployed.verification).toEqual({ ok: true });
    expect(deployed.historyRecorded).toBe(true);
    expect(state.buildCalls).toBe(1);
    expect(state.appStoreMutations).toBe(5);
    expect(state.uploadCalls).toBe(1);
    const second = await inspectProjectIosDeploymentWithRuntime({ projectRoot, intent: INTENT, ...ACCESS }, runtime);
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
    expect(state.appStoreMutations).toBe(5);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('project iOS execution rejects source drift before build or App Store mutation', async () => {
  const projectRoot = await createIosProject();
  const state = { fingerprint: 'b'.repeat(40), buildCalls: 0, appStoreMutations: 0, uploadCalls: 0, deployed: false };
  const runtime = createRuntime(state);
  try {
    const inspected = await inspectProjectIosDeploymentWithRuntime({ projectRoot, intent: INTENT, ...ACCESS }, runtime);
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
    expect(state.appStoreMutations).toBe(0);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

function createIosProject(): Promise<string> {
  return createTempProject(
    createTestManifest({ targets: { ios: { enabled: true, bundleIdentifier: 'com.example.app' } } }),
  );
}
