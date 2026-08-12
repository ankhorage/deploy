import { expect, test } from 'bun:test';

import { inspectDeploymentProviderSetup } from './inspectDeploymentProviderSetup';
import {
  createSetupAdapter,
  createSetupContext,
  FIXTURE_SECRET,
} from './providerSetupTestSupport.test';

test('normalizes thrown provider errors without leaking exception messages', async () => {
  const adapter = createSetupAdapter(async (context) => {
    const [reference] = context.credentials;
    if (reference === undefined) throw new Error('missing credential');
    const secret = await context.resolveSecret(reference);
    throw new Error(`provider failed with ${secret ?? 'missing'}`);
  });

  const result = await inspectDeploymentProviderSetup({ adapter, context: createSetupContext() });
  expect(result).toEqual({
    ok: false,
    failure: {
      code: 'PROVIDER_SETUP_INSPECTION_FAILED',
      message: 'Provider setup inspection failed.',
      provider: 'fixture-provider',
    },
  });
  expect(JSON.stringify(result)).not.toContain(FIXTURE_SECRET);
});
