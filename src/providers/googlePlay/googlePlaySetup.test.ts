import { expect, test } from 'bun:test';

import { inspectDeploymentProviderSetup } from '../../engine/inspectDeploymentProviderSetup';
import { createGooglePlaySetupAdapter } from './createGooglePlaySetupAdapter';

const CREDENTIAL = { provider: 'google-play', id: 'publisher', kind: 'service-account' } as const;
const SECRET = JSON.stringify({
  type: 'service_account',
  client_email: 'robot@example.test',
  private_key: 'PRIVATE_KEY_SENTINEL',
});

test('Google Play setup exposes publish capability without secret material', async () => {
  const result = await inspectDeploymentProviderSetup({
    adapter: createGooglePlaySetupAdapter({ createToken: () => Promise.resolve('token') }),
    context: {
      target: 'android',
      credentials: [CREDENTIAL],
      resolveSecret: () => Promise.resolve(SECRET),
    },
  });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.inspection.capabilities).toEqual([{ capability: 'publish', status: 'available' }]);
  expect(JSON.stringify(result)).not.toContain('PRIVATE_KEY_SENTINEL');
});

test('Google Play setup returns authentication action for invalid credentials', async () => {
  const result = await inspectDeploymentProviderSetup({
    adapter: createGooglePlaySetupAdapter({ createToken: () => Promise.resolve('token') }),
    context: {
      target: 'android',
      credentials: [CREDENTIAL],
      resolveSecret: () => Promise.resolve('{"type":"external_account"}'),
    },
  });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.inspection.authentication.status).toBe('required');
});
