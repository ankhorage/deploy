import { spawn } from 'node:child_process';

import type { DeploymentProcessResult, DeploymentProcessRunner } from './DeploymentProcessRunner';

export const runDeploymentProcess: DeploymentProcessRunner = async (
  request,
): Promise<DeploymentProcessResult> =>
  new Promise((resolve) => {
    const child = spawn(request.command, [...request.args], {
      cwd: request.cwd,
      env: { ...process.env, ...request.env },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', () => settle(-1));
    child.on('close', (code) => settle(code ?? -1));

    function settle(exitCode: number): void {
      if (settled) return;
      settled = true;
      resolve({ exitCode, stdout, stderr });
    }
  });
