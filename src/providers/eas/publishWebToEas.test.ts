import { expect, test } from 'bun:test';

import type { DeploymentProcessRequest } from '../../runtime/process/DeploymentProcessRunner';
import { publishWebToEas } from './publishWebToEas';

const SECRET = 'PUBLISH_SECRET_SENTINEL';
const CREDENTIAL = { provider: 'eas', id: 'hosting', kind: 'expo-token' } as const;

test('EAS publish maps production intent and normalizes JSON output', async () => {
  let request: DeploymentProcessRequest | null = null;
  const result = await publishWebToEas({
    projectRoot: '/project',
    exportDirectory: '/tmp/export',
    revision: 'abc123',
    intent: { mode: 'production', alias: 'stable', environment: 'production' },
    credentials: [CREDENTIAL],
    resolveSecret: () => Promise.resolve(SECRET),
    runProcess: (value) => {
      request = value;
      return Promise.resolve({
        exitCode: 0,
        stdout: JSON.stringify({ identifier: 'deploy-id', url: 'https://example.expo.app', extra: SECRET }),
        stderr: '',
      });
    },
  });
  expect(result.status).toBe('completed');
  expect(request?.args).toContain('--json');
  expect(request?.args).toContain('--non-interactive');
  expect(request?.args).toContain('--prod');
  expect(request?.args).toContain('--alias');
  expect(request?.args).toContain('--environment');
  expect(request?.env?.EXPO_TOKEN).toBe(SECRET);
  expect(request?.args.includes(SECRET)).toBe(false);
  expect(JSON.stringify(result)).not.toContain(SECRET);
});

test('EAS publish rejects malformed provider JSON without stderr leakage', async () => {
  const result = await publishWebToEas({
    projectRoot: '/project',
    exportDirectory: '/tmp/export',
    revision: 'abc123',
    intent: { mode: 'preview' },
    credentials: [],
    resolveSecret: () => Promise.resolve(null),
    runProcess: () => Promise.resolve({ exitCode: 0, stdout: 'not-json', stderr: SECRET }),
  });
  expect(result.status).toBe('failed');
  expect(JSON.stringify(result)).not.toContain(SECRET);
});
