import { expect, test } from 'bun:test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { DeploymentProcessRunner } from '../../runtime/process/DeploymentProcessRunner';
import { createTempProject, createTestManifest } from '../manifestTestSupport.test';
import { createProjectWebDeploymentPlan } from './createProjectWebDeploymentPlan';
import { executeProjectWebDeploymentWithRuntime } from './executeProjectWebDeployment';
import { inspectProjectWebDeploymentWithRuntime } from './inspectProjectWebDeployment';
import type { ProjectWebDeploymentRuntime } from './ProjectWebDeploymentRuntime';

function createRuntime(state: { source: string; deployCalls: number }): ProjectWebDeploymentRuntime {
  const runProcess: DeploymentProcessRunner = async (request) => {
    if (request.args[0] === 'export') {
      const output = request.args[request.args.indexOf('--output-dir') + 1];
      if (output === undefined) return { exitCode: 1, stdout: '', stderr: '' };
      await fs.mkdir(output, { recursive: true });
      await fs.writeFile(path.join(output, 'index.html'), state.source);
      return { exitCode: 0, stdout: '', stderr: '' };
    }
    if (request.args[0] === 'deploy') {
      state.deployCalls += 1;
      return {
        exitCode: 0,
        stdout: JSON.stringify({ identifier: 'web-deploy-1', url: 'https://web.expo.app' }),
        stderr: '',
      };
    }
    return { exitCode: 0, stdout: '', stderr: '' };
  };
  return {
    runProcess,
    probeHttp: () => Promise.resolve({ status: 200 }),
    now: () => new Date('2026-08-12T14:00:00.000Z'),
  };
}

test('project Web lifecycle publishes verifies records history then becomes no-change', async () => {
  const projectRoot = await createTempProject(
    createTestManifest({ targets: { web: { enabled: true } } }),
  );
  const state = { source: '<html>same</html>', deployCalls: 0 };
  const runtime = createRuntime(state);
  try {
    const inspected = await inspectProjectWebDeploymentWithRuntime({ projectRoot }, runtime);
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;
    expect(inspected.inspection.desired.targets.web?.providers).toEqual({
      build: 'expo',
      publish: 'eas',
    });
    const plan = createProjectWebDeploymentPlan(inspected.inspection);
    expect(plan.steps.map((step) => step.id)).toEqual(['web:prepare', 'web:publish', 'web:verify']);

    const deployed = await executeProjectWebDeploymentWithRuntime(
      { inspection: inspected.inspection, plan },
      runtime,
    );
    expect(deployed.execution.status).toBe('completed');
    expect(deployed.verification).toEqual({ ok: true });
    expect(deployed.historyRecorded).toBe(true);
    expect(state.deployCalls).toBe(1);

    const second = await inspectProjectWebDeploymentWithRuntime({ projectRoot }, runtime);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    const secondPlan = createProjectWebDeploymentPlan(second.inspection);
    expect(secondPlan.steps).toEqual([]);
    const noChange = await executeProjectWebDeploymentWithRuntime(
      { inspection: second.inspection, plan: secondPlan },
      runtime,
    );
    expect(noChange.execution.status).toBe('completed');
    expect(noChange.historyRecorded).toBe(false);
    expect(state.deployCalls).toBe(1);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});

test('project Web execution rejects source drift after planning', async () => {
  const projectRoot = await createTempProject(
    createTestManifest({ targets: { web: { enabled: true } } }),
  );
  const state = { source: 'before', deployCalls: 0 };
  const runtime = createRuntime(state);
  try {
    const inspected = await inspectProjectWebDeploymentWithRuntime({ projectRoot }, runtime);
    if (!inspected.ok) throw new Error('inspection failed');
    const plan = createProjectWebDeploymentPlan(inspected.inspection);
    state.source = 'after';
    const result = await executeProjectWebDeploymentWithRuntime(
      { inspection: inspected.inspection, plan },
      runtime,
    );
    expect(result.execution.status).toBe('failed');
    if (result.execution.status === 'failed') {
      expect(result.execution.failure.code).toBe('WEB_SOURCE_CHANGED_AFTER_PLAN');
    }
    expect(state.deployCalls).toBe(0);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});
