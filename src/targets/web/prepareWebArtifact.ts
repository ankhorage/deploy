import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentProcessRunner } from '../../runtime/process/DeploymentProcessRunner';
import { hashWebExport } from './hashWebExport';
import type { PreparedWebArtifact } from './PreparedWebArtifact';

export type PrepareWebArtifactResult =
  | { readonly ok: true; readonly artifact: PreparedWebArtifact }
  | { readonly ok: false; readonly failure: DeploymentFailure };

export async function prepareWebArtifact(options: {
  readonly projectRoot: string;
  readonly runProcess: DeploymentProcessRunner;
}): Promise<PrepareWebArtifactResult> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ankh-deploy-web-'));
  const result = await options.runProcess({
    command: projectExpoCommand(options.projectRoot),
    args: ['export', '--platform', 'web', '--output-dir', directory],
    cwd: options.projectRoot,
  });
  if (result.exitCode !== 0) {
    await cleanupWebArtifact(directory);
    return {
      ok: false,
      failure: {
        code: 'WEB_EXPORT_FAILED',
        message: 'Web artifact export failed.',
        target: 'web',
        provider: 'expo',
      },
    };
  }
  try {
    return { ok: true, artifact: { directory, revision: await hashWebExport(directory) } };
  } catch {
    await cleanupWebArtifact(directory);
    return {
      ok: false,
      failure: {
        code: 'WEB_EXPORT_INVALID',
        message: 'Web artifact could not be normalized.',
        target: 'web',
        provider: 'expo',
      },
    };
  }
}

export async function cleanupWebArtifact(directory: string): Promise<void> {
  await fs.rm(directory, { recursive: true, force: true });
}

function projectExpoCommand(projectRoot: string): string {
  return path.join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'expo.cmd' : 'expo');
}
