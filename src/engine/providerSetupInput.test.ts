import { expect, test } from 'bun:test';

import { inspectDeploymentProviderSetup } from './inspectDeploymentProviderSetup';
import {
  createSetupAdapter,
  FIXTURE_CREDENTIAL,
  FIXTURE_PROVIDER,
} from './providerSetupTestSupport.test';

test('rejects invalid credential references before invoking the adapter', async () => {
  let called = false;
  const adapter = createSetupAdapter(() => {
    called = true;
    throw new Error('should not run');
  });
  const result = await inspectDeploymentProviderSetup({
    adapter,
    context: {
      credentials: [{ ...FIXTURE_CREDENTIAL, id: '   ' }],
      resolveSecret: () => Promise.resolve('secret'),
    },
  });
  expect(called).toBe(false);
  expect(result).toEqual({
    ok: false,
    failure: {
      code: 'INVALID_PROVIDER_SETUP_INPUT',
      message: 'Provider setup input is invalid.',
      provider: FIXTURE_PROVIDER,
    },
  });
});

test('rejects credential references owned by another provider', async () => {
  const adapter = createSetupAdapter(() => Promise.reject(new Error('should not run')));
  const result = await inspectDeploymentProviderSetup({
    adapter,
    context: {
      credentials: [{ ...FIXTURE_CREDENTIAL, provider: 'other-provider' }],
      resolveSecret: () => Promise.resolve(null),
    },
  });
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.code).toBe('INVALID_PROVIDER_SETUP_INPUT');
});
