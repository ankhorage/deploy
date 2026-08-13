import { promises as fs } from 'node:fs';
import path from 'node:path';

import { expect, test } from 'bun:test';

import type { AppStoreConnectTransport } from '../../providers/appStoreConnect/AppStoreConnectTransport';
import type { GooglePlayTransport } from '../../providers/googlePlay/GooglePlayTransport';
import { createTempProject, createTestManifest } from '../manifestTestSupport.test';
import { createProjectMonetizationPlan } from './createProjectMonetizationPlan';
import { executeProjectMonetizationSyncWithRuntime } from './executeProjectMonetizationSyncWithRuntime';
import { inspectProjectMonetizationWithRuntime } from './inspectProjectMonetizationWithRuntime';
import type { ProjectMonetizationRuntime } from './ProjectMonetizationRuntime';

const ACCESS = {
  credentials: [
    { provider: 'google-play', id: 'play', kind: 'service-account' },
    { provider: 'app-store-connect', id: 'apple', kind: 'api-key' },
  ],
  resolveSecret: (reference: { provider: string }) =>
    Promise.resolve(
      reference.provider === 'google-play'
        ? JSON.stringify({
            type: 'service_account',
            client_email: 'robot@example.test',
            private_key: 'PRIVATE_KEY_SENTINEL',
          })
        : JSON.stringify({
            keyId: 'KEY',
            issuerId: 'ISSUER',
            privateKey: 'PRIVATE_KEY_SENTINEL',
          }),
    ),
} as const;

test('project monetization lifecycle inspects both stores and remains no-change', async () => {
  const projectRoot = await createTempProject(
    createTestManifest({
      targets: {
        android: { enabled: true, package: 'com.example.app' },
        ios: { enabled: true, bundleIdentifier: 'com.example.app' },
      },
    }),
  );
  const state = { mutations: 0 };
  const runtime = createRuntime(state);
  try {
    const result = await inspectProjectMonetizationWithRuntime({ projectRoot, ...ACCESS }, runtime);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inspection.states.map((state) => state.target)).toEqual(['android', 'ios']);
    const plan = createProjectMonetizationPlan(result.inspection);
    expect(plan.status).toBe('no-change');
    const execution = await executeProjectMonetizationSyncWithRuntime(
      { inspection: result.inspection, plan, ...ACCESS },
      runtime,
    );
    expect(execution.status).toBe('completed');
    expect(state.mutations).toBe(0);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('project monetization plan blocks when store access requires action', async () => {
  const projectRoot = await createTempProject(
    createTestManifest({
      targets: { android: { enabled: true, package: 'com.example.app' } },
    }),
  );
  const state = { mutations: 0 };
  const runtime = createRuntime(state);
  try {
    const result = await inspectProjectMonetizationWithRuntime({ projectRoot }, runtime);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const plan = createProjectMonetizationPlan(result.inspection);
    expect(plan.status).toBe('blocked');
    expect(plan.actions.map((action) => action.code)).toEqual([
      'GOOGLE_PLAY_AUTHENTICATION_REQUIRED',
    ]);
    const execution = await executeProjectMonetizationSyncWithRuntime(
      { inspection: result.inspection, plan },
      runtime,
    );
    expect(execution.status).toBe('action-required');
    expect(state.mutations).toBe(0);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('project monetization execution rejects authored drift before store mutation', async () => {
  const projectRoot = await createTempProject(
    createTestManifest({
      targets: { android: { enabled: true, package: 'com.example.app' } },
    }),
  );
  const state = { mutations: 0 };
  const runtime = createRuntime(state);
  try {
    await writeProducts(projectRoot, '4.99');
    const result = await inspectProjectMonetizationWithRuntime({ projectRoot, ...ACCESS }, runtime);
    if (!result.ok) throw new Error('Expected monetization inspection.');
    const plan = createProjectMonetizationPlan(result.inspection);
    expect(plan.status).toBe('changes');
    await writeProducts(projectRoot, '5.99');
    const execution = await executeProjectMonetizationSyncWithRuntime(
      { inspection: result.inspection, plan, ...ACCESS },
      runtime,
    );
    expect(execution.status).toBe('failed');
    if (execution.status === 'failed') {
      expect(execution.failure.code).toBe('PROJECT_MONETIZATION_DRIFT');
    }
    expect(state.mutations).toBe(0);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

function createRuntime(state: { mutations: number }): ProjectMonetizationRuntime {
  return {
    createGooglePlayToken: () => Promise.resolve('google-token'),
    requestGooglePlay: googleTransport(state),
    createAppStoreConnectToken: () => Promise.resolve('apple-token'),
    requestAppStoreConnect: appStoreTransport(state),
    now: () => new Date('2026-08-13T12:00:00Z'),
  };
}

function googleTransport(state: { mutations: number }): GooglePlayTransport {
  return (request) => {
    if (request.method !== 'GET') {
      state.mutations += 1;
    }
    if (request.url.includes('/oneTimeProducts')) {
      return Promise.resolve({ status: 200, body: '{"oneTimeProducts":[]}' });
    }
    if (request.url.includes('/subscriptions')) {
      return Promise.resolve({ status: 200, body: '{"subscriptions":[]}' });
    }
    return Promise.resolve({ status: 404, body: '{}' });
  };
}

function appStoreTransport(state: { mutations: number }): AppStoreConnectTransport {
  return (request) => {
    if (request.method !== 'GET') {
      state.mutations += 1;
    }
    if (request.url.includes('/apps?')) {
      return Promise.resolve({
        status: 200,
        body: JSON.stringify({
          data: [{ type: 'apps', id: 'app-1', attributes: { bundleId: 'com.example.app' } }],
        }),
      });
    }
    if (request.url.includes('/inAppPurchasesV2?')) {
      return Promise.resolve({ status: 200, body: '{"data":[]}' });
    }
    if (request.url.includes('/subscriptionGroups?')) {
      return Promise.resolve({ status: 200, body: '{"data":[]}' });
    }
    return Promise.resolve({ status: 404, body: '{}' });
  };
}

async function writeProducts(projectRoot: string, amount: string): Promise<void> {
  const directory = path.join(projectRoot, 'deploy', 'monetization');
  return writeProductsFile(directory, amount);
}

async function writeProductsFile(directory: string, amount: string): Promise<void> {
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(
    path.join(directory, 'products.json'),
    `${JSON.stringify(
      {
        products: [
          {
            id: 'premium.unlock',
            kind: 'non-consumable',
            localizations: [{ locale: 'en-US', name: 'Premium', description: 'Unlock premium' }],
            basePrice: { country: 'US', currency: 'USD', amount },
          },
        ],
      },
      null,
      2,
    )}\n`,
  );
}
