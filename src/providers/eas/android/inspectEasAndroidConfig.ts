import type { DeploymentCredentialReference } from '../../../domain/DeploymentCredentialReference';
import type { DeploymentFailure } from '../../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../../domain/DeploymentSecretResolver';
import type { DeploymentProcessRunner } from '../../../runtime/process/DeploymentProcessRunner';
import { resolveEasProcessEnvironment } from '../resolveEasProcessEnvironment';
import { parseEasAndroidConfig } from './parseEasAndroidConfig';

export interface EasAndroidConfigSnapshot {
  readonly packageName: string;
  readonly profileEnvironment: Readonly<Record<string, string>>;
}

export type EasAndroidConfigResult =
  | { readonly status: 'completed'; readonly config: EasAndroidConfigSnapshot }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };

export async function inspectEasAndroidConfig(options: {
  readonly projectRoot: string;
  readonly packageName: string;
  readonly buildProfile: string;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly runProcess: DeploymentProcessRunner;
}): Promise<EasAndroidConfigResult> {
  if (options.buildProfile.trim().length === 0) return invalidProfile();
  const environment = await resolveEasProcessEnvironment({ ...options, target: 'android' });
  if (!environment.ok) return { status: 'action-required', action: environment.action };
  const result = await options.runProcess({
    command: 'eas',
    args: ['config', '--platform', 'android', '--profile', options.buildProfile, '--json', '--non-interactive'],
    cwd: options.projectRoot,
    ...(environment.env === undefined ? {} : { env: environment.env }),
  });
  if (result.exitCode !== 0) return failure('EAS_ANDROID_CONFIG_FAILED');
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    return failure('EAS_ANDROID_CONFIG_INVALID');
  }
  return parseEasAndroidConfig(parsed, options.packageName);
}

function invalidProfile(): EasAndroidConfigResult {
  return failure('INVALID_ANDROID_BUILD_PROFILE', 'Android build profile is invalid.');
}

function failure(
  code: string,
  message = 'EAS Android project configuration could not be inspected.',
): EasAndroidConfigResult {
  return { status: 'failed', failure: { code, message, target: 'android', provider: 'eas' } };
}
