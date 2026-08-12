import { expect, test } from 'bun:test';

import { inspectDeploymentProviderSetup } from './inspectDeploymentProviderSetup';
import {
  createSetupAdapter,
  createSetupContext,
  FIXTURE_PROVIDER,
} from './providerSetupTestSupport.test';

test('normalizes capability order and preserves structured setup requirements', async () => {
  const adapter = createSetupAdapter(() =>
    Promise.resolve({
      provider: FIXTURE_PROVIDER,
      authentication: {
        status: 'required',
        action: {
          type: 'authentication',
          provider: FIXTURE_PROVIDER,
          code: 'LOGIN',
          message: 'Authenticate the provider.',
        },
      },
      capabilities: [
        { capability: 'publish', status: 'available' },
        { capability: 'provision', status: 'unavailable', reason: 'Account setup required.' },
      ],
      provisioning: [
        {
          type: 'automated',
          id: 'account-link',
          provider: FIXTURE_PROVIDER,
          code: 'LINK_ACCOUNT',
          message: 'Link the provider account.',
        },
        {
          type: 'manual-action',
          action: {
            type: 'manual-action',
            target: 'web',
            provider: FIXTURE_PROVIDER,
            code: 'ACCEPT_TERMS',
            message: 'Accept provider terms.',
          },
        },
      ],
    }),
  );

  const result = await inspectDeploymentProviderSetup({ adapter, context: createSetupContext() });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.inspection.capabilities.map(({ capability }) => capability)).toEqual([
    'provision',
    'publish',
  ]);
  expect(result.inspection.authentication.status).toBe('required');
  expect(result.inspection.provisioning).toHaveLength(2);
});
