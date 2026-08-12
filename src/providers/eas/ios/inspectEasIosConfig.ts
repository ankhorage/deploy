import type { DeploymentCredentialReference } from '../../../domain/DeploymentCredentialReference';
import type { DeploymentFailure } from '../../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../../domain/DeploymentSecretResolver';
import type { DeploymentProcessRunner } from '../../../runtime/process/DeploymentProcessRunner';
import { resolveEasProcessEnvironment } from '../resolveEasProcessEnvironment';
import { parseEasIosConfig } from './parseEasIosConfig';

export interface EasIosConfigSnapshot {
  readonly bundleIdentifier: string;
  readonly profileEnvironment: Readonly<Record<string, string>>;
}

export type EasIosConfigResult =
  | { readonly status: 'completed'; readonly config: EasIosConfigSnapshot }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };

export async function inspectEasIosConfig(options: {
  readonly projectRoot: string;
  readonly bundleIdentifier: string;
  readonly buildProfile: string;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly runProcess: DeploymentProcessRunner;
}): Promise<EasIosConfigResult> {
  if (options.buildProfile.trim().length === 0) return invalidProfile();
  const environment = await resolveEasProcessEnvironment({ ...options, target: 'ios' });
  if (!environment.ok) return { status: 'action-required', action: environment.action };
  const result = await options.runProcess({
    command: 'eas',
    args: [
      'config',
      '--platform',
      'ios',
      '--profile',
      options.buildProfile,
      '--json',
      '--non-interactive',
    ],
    cwd: options.projectRoot,
    ...(environment.env === undefined ? {} : { env: environment.env }),
  });
  if (result.exitCode !== 0) return failure('EAS_IOS_CONFIG_FAILED');
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    return failure('EAS_IOS_CONFIG_INVALID');
  }
  return parseEasIosConfig(parsed, options.bundleIdentifier);
}

function invalidProfile(): EasIosConfigResult {
  return failure('INVALID_IOS_BUILD_PROFILE', 'iOS build profile is invalid.');
}

function failure(
  code: string,
  message = 'EAS iOS project configuration could not be inspected.',
): EasIosConfigResult {
  return { status: 'failed', failure: { code, message, target: 'ios', provider: 'eas' } };
}
