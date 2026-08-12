import type { DeploymentCredentialReference } from '../../../domain/DeploymentCredentialReference';
import type { DeploymentFailure } from '../../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../../domain/DeploymentSecretResolver';
import type { DeploymentProcessRunner } from '../../../runtime/process/DeploymentProcessRunner';
import { resolveEasProcessEnvironment } from '../resolveEasProcessEnvironment';
import type { EasAndroidBuildArtifact } from './EasAndroidBuildArtifact';
import { parseEasAndroidBuild } from './parseEasAndroidBuild';

export type EasAndroidBuildResult =
  | { readonly status: 'completed'; readonly artifact: EasAndroidBuildArtifact }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };

export async function buildAndroidWithEas(options: {
  readonly projectRoot: string;
  readonly buildProfile: string;
  readonly expectedFingerprint: string;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly runProcess: DeploymentProcessRunner;
}): Promise<EasAndroidBuildResult> {
  const environment = await resolveEasProcessEnvironment({ ...options, target: 'android' });
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
    return failure('EAS_ANDROID_BUILD_INVALID', 'EAS Android build returned an invalid result.');
  }
  const artifact = parseEasAndroidBuild(parsed, options.expectedFingerprint, options.buildProfile);
  return artifact === null
    ? failure('EAS_ANDROID_BUILD_INVALID', 'EAS Android build returned an invalid result.')
    : { status: 'completed', artifact };
}

function buildArgs(buildProfile: string): readonly string[] {
  return ['build', '--platform', 'android', '--profile', buildProfile, '--json', '--non-interactive', '--wait'];
}

function failedBuild(stderr: string): EasAndroidBuildResult {
  const lower = stderr.toLowerCase();
  if (lower.includes('keystore') || lower.includes('credential')) {
    return {
      status: 'action-required',
      action: {
        type: 'manual-action',
        target: 'android',
        provider: 'eas',
        code: 'EAS_ANDROID_SIGNING_SETUP_REQUIRED',
        message: 'Android signing credentials require EAS account or project setup.',
      },
    };
  }
  return failure('EAS_ANDROID_BUILD_FAILED', 'EAS Android build failed.');
}

function failure(code: string, message: string): EasAndroidBuildResult {
  return { status: 'failed', failure: { code, message, target: 'android', provider: 'eas' } };
}
