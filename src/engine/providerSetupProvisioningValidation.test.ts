import { expect, test } from 'bun:test';

import { inspectDeploymentProviderSetup } from './inspectDeploymentProviderSetup';
import { createSetupInspection } from './providerSetupInspectionFixture.test';
import {
  createSetupAdapter,
  createSetupContext,
  FIXTURE_PROVIDER,
} from './providerSetupTestSupport.test';

test('rejects duplicate automated provisioning requirement ids', async () => {
  const automated = {
    type: 'automated' as const,
    id: 'bootstrap',
    provider: FIXTURE_PROVIDER,
    code: 'BOOTSTRAP',
    message: 'Bootstrap provider resources.',
  };
  const adapter = createSetupAdapter(() =>
    Promise.resolve({
      ...createSetupInspection(),
      provisioning: [automated, automated],
    }),
  );
  const result = await inspectDeploymentProviderSetup({ adapter, context: createSetupContext() });
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.code).toBe('PROVIDER_SETUP_INVALID_RESULT');
});

test('allows target-independent automated provisioning requirements', async () => {
  const adapter = createSetupAdapter(() =>
    Promise.resolve({
      ...createSetupInspection(),
      provisioning: [
        {
          type: 'automated',
          id: 'account',
          provider: FIXTURE_PROVIDER,
          code: 'ACCOUNT_SETUP',
          message: 'Configure the provider account.',
        },
      ],
    }),
  );
  const result = await inspectDeploymentProviderSetup({ adapter, context: createSetupContext() });
  expect(result.ok).toBe(true);
});
