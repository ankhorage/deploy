import { expect, test } from 'bun:test';

import { inspectDeploymentProviderSetup } from '../../engine/inspectDeploymentProviderSetup';
import type {
  DeploymentProcessRequest,
  DeploymentProcessRunner,
} from '../../runtime/process/DeploymentProcessRunner';
import { createEasSetupAdapter } from './createEasSetupAdapter';

const SECRET = 'EAS_SECRET_SENTINEL';
const CREDENTIAL = { provider: 'eas', id: 'build', kind: 'expo-token' } as const;

function adapter(runProcess: DeploymentProcessRunner) {
  return createEasSetupAdapter({
    projectRoot: '/project',
    runProcess,
    target: 'android',
    capability: 'build',
  });
}

test('EAS setup resolves token only into process environment', async () => {
  const requests: DeploymentProcessRequest[] = [];
  const runProcess: DeploymentProcessRunner = (request) => {
    requests.push(request);
    return Promise.resolve({ exitCode: 0, stdout: '', stderr: '' });
  };
  const result = await inspectDeploymentProviderSetup({
    adapter: adapter(runProcess),
    context: {
      target: 'android',
      credentials: [CREDENTIAL],
      resolveSecret: () => Promise.resolve(SECRET),
    },
  });
  expect(result.ok).toBe(true);
  expect(requests.map((request) => request.args[0])).toEqual(['account:view', 'project:info']);
  expect(requests.every((request) => request.env?.EXPO_TOKEN === SECRET)).toBe(true);
  expect(requests.some((request) => request.args.includes(SECRET))).toBe(false);
  expect(JSON.stringify(result)).not.toContain(SECRET);
});

test('EAS setup returns target-aware authentication action', async () => {
  const runProcess: DeploymentProcessRunner = () =>
    Promise.resolve({ exitCode: 1, stdout: '', stderr: SECRET });
  const result = await inspectDeploymentProviderSetup({
    adapter: adapter(runProcess),
    context: { target: 'android', credentials: [], resolveSecret: () => Promise.resolve(null) },
  });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.inspection.authentication.status).toBe('required');
  if (result.inspection.authentication.status !== 'required') return;
  expect(result.inspection.authentication.action.target).toBe('android');
  expect(result.inspection.capabilities[0]?.capability).toBe('build');
  expect(JSON.stringify(result)).not.toContain(SECRET);
});

test('EAS setup reports an unlinked project as a manual action', async () => {
  let calls = 0;
  const runProcess: DeploymentProcessRunner = () => {
    calls += 1;
    return Promise.resolve({ exitCode: calls === 1 ? 0 : 1, stdout: '', stderr: '' });
  };
  const result = await inspectDeploymentProviderSetup({
    adapter: adapter(runProcess),
    context: { target: 'android', credentials: [], resolveSecret: () => Promise.resolve(null) },
  });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.inspection.provisioning[0]?.type).toBe('manual-action');
});
