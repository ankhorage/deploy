import { expect, test } from 'bun:test';

import type { WebDeploymentPublication } from '../../domain/WebDeploymentPublication';
import { verifyWebPublication } from './verifyWebPublication';

const PUBLICATION: WebDeploymentPublication = {
  target: 'web',
  revision: 'abc',
  provider: 'eas',
  deploymentId: 'id',
  url: 'https://example.expo.app',
  production: false,
};

test('web verification accepts reachable responses below 500', async () => {
  expect(await verifyWebPublication(PUBLICATION, () => Promise.resolve({ status: 404 }))).toEqual({
    ok: true,
  });
});

test('web verification rejects 5xx and network failures safely', async () => {
  const unavailable = await verifyWebPublication(PUBLICATION, () => Promise.resolve({ status: 503 }));
  expect(unavailable.ok).toBe(false);
  const failed = await verifyWebPublication(PUBLICATION, () => Promise.reject(new Error('private')));
  expect(failed.ok).toBe(false);
  expect(JSON.stringify(failed)).not.toContain('private');
});
