import { expect, test } from 'bun:test';

import { inspectDeploymentProviderSetup } from './inspectDeploymentProviderSetup';
import { createSetupInspection } from './providerSetupInspectionFixture.test';
import {
  createSetupAdapter,
  createSetupContext,
  FIXTURE_CREDENTIAL,
  FIXTURE_SECRET,
} from './providerSetupTestSupport.test';

test('supplies secret material only through the injected resolver', async () => {
  const resolvedIds: string[] = [];
  const adapter = createSetupAdapter(async (context) => {
    const [reference] = context.credentials;
    if (reference === undefined) throw new Error('missing credential');
    resolvedIds.push(reference.id);
    await context.resolveSecret(reference);
    return createSetupInspection();
  });

  const result = await inspectDeploymentProviderSetup({ adapter, context: createSetupContext() });
  expect(resolvedIds).toEqual([FIXTURE_CREDENTIAL.id]);
  expect(result.ok).toBe(true);
  expect(JSON.stringify(result)).not.toContain(FIXTURE_SECRET);
});

test('rejects portable setup results that echo resolved secret material', async () => {
  const adapter = createSetupAdapter(async (context) => {
    const [reference] = context.credentials;
    if (reference === undefined) throw new Error('missing credential');
    const secret = await context.resolveSecret(reference);
    return {
      ...createSetupInspection(),
      capabilities: [{ capability: 'build', status: 'unavailable', reason: secret ?? 'missing' }],
    };
  });
  const result = await inspectDeploymentProviderSetup({ adapter, context: createSetupContext() });
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.code).toBe('PROVIDER_SETUP_UNSAFE_RESULT');
  expect(JSON.stringify(result)).not.toContain(FIXTURE_SECRET);
});
