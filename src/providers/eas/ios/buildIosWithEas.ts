import type { DeploymentCredentialReference } from '../../../domain/DeploymentCredentialReference';
import type { DeploymentFailure } from '../../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../../domain/DeploymentSecretResolver';
import type { DeploymentProcessRunner } from '../../../runtime/process/DeploymentProcessRunner';
import { resolveEasProcessEnvironment } from '../resolveEasProcessEnvironment';
import type { EasIosBuildArtifact } from './EasIosBuildArtifact';
import { parseEasIosBuild } from './parseEasIosBuild';

export type EasIosBuildResult =
  | { readonly status: 'completed'; readonly artifact: EasIosBuildArtifact }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };

export async function buildIosWithEas(options: {
  readonly projectRoot: string;
  readonly buildProfile: string;
  readonly expectedFingerprint: string;
  readonly expectedVersion: string;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly runProcess: DeploymentProcessRunner;
}): Promise<EasIosBuildResult> {
  const environment = await resolveEasProcessEnvironment({ ...options, target: 'ios' });
  if (!environment.ok) return { status: 'action-required', action: environment.action };
  const result = await options.runProcess({
    command: 'eas',
    args: buildArgs(options.buildProfile),
    cwd: options.projectRoot,
    ...(environment.env === undefined ? {} : { env: environment.env }),
  });
  if (result.exitCode !== 0) return failedBuild(result.stderr);
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    return failure('EAS_IOS_BUILD_INVALID', 'EAS iOS build returned an invalid result.');
  }
  const artifact = parseEasIosBuild(
    parsed,
    options.expectedFingerprint,
    options.buildProfile,
    options.expectedVersion,
  );
  return artifact === null
    ? failure('EAS_IOS_BUILD_INVALID', 'EAS iOS build returned an invalid result.')
    : { status: 'completed', artifact };
}

function buildArgs(buildProfile: string): readonly string[] {
  return [
    'build',
    '--platform',
    'ios',
    '--profile',
    buildProfile,
    '--json',
    '--non-interactive',
    '--wait',
  ];
}

function failedBuild(stderr: string): EasIosBuildResult {
  const lower = stderr.toLowerCase();
  if (
    lower.includes('provisioning profile') ||
    lower.includes('distribution certificate') ||
    lower.includes('credential')
  ) {
    return {
      status: 'action-required',
      action: {
        type: 'manual-action',
        target: 'ios',
        provider: 'eas',
        code: 'EAS_IOS_SIGNING_SETUP_REQUIRED',
        message: 'iOS signing credentials require EAS account or project setup.',
      },
    };
  }
  return failure('EAS_IOS_BUILD_FAILED', 'EAS iOS build failed.');
}

function failure(code: string, message: string): EasIosBuildResult {
  return { status: 'failed', failure: { code, message, target: 'ios', provider: 'eas' } };
}
