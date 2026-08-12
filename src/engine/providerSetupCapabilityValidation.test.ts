import { expect, test } from 'bun:test';

import { inspectDeploymentProviderSetup } from './inspectDeploymentProviderSetup';
import { createSetupInspection } from './providerSetupInspectionFixture.test';
import {
  createSetupAdapter,
  createSetupContext,
} from './providerSetupTestSupport.test';

test('rejects provider identity mismatches from adapters', async () => {
  const adapter = createSetupAdapter(() =>
    Promise.resolve({ ...createSetupInspection(), provider: 'other-provider' }),
  );
  const result = await inspectDeploymentProviderSetup({ adapter, context: createSetupContext() });
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.code).toBe('PROVIDER_SETUP_INVALID_RESULT');
});

test('rejects duplicate provider capabilities', async () => {
  const adapter = createSetupAdapter(() =>
    Promise.resolve({
      ...createSetupInspection(),
      capabilities: [
        { capability: 'build', status: 'available' },
        { capability: 'build', status: 'unavailable', reason: 'Not configured.' },
      ],
    }),
  );
  const result = await inspectDeploymentProviderSetup({ adapter, context: createSetupContext() });
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.code).toBe('PROVIDER_SETUP_INVALID_RESULT');
});
