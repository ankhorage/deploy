import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { WebDeploymentPublication } from '../../domain/WebDeploymentPublication';
import type { WebDeploymentPublishIntent } from '../../domain/WebDeploymentPublishIntent';
import type { DeploymentProcessRunner } from '../../runtime/process/DeploymentProcessRunner';
import { parseEasWebPublication } from './parseEasWebPublication';
import { resolveEasProcessEnvironment } from './resolveEasProcessEnvironment';

export type EasWebPublishResult =
  | { readonly status: 'completed'; readonly publication: WebDeploymentPublication }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };

export async function publishWebToEas(options: {
  readonly projectRoot: string;
  readonly exportDirectory: string;
  readonly revision: string;
  readonly intent: WebDeploymentPublishIntent;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly runProcess: DeploymentProcessRunner;
}): Promise<EasWebPublishResult> {
  if (!isValidIntent(options.intent)) return invalidIntentFailure();
  const environment = await resolveEasProcessEnvironment(options);
  if (!environment.ok) return { status: 'action-required', action: environment.action };

  const result = await options.runProcess({
    command: 'eas',
    args: createDeployArgs(options.exportDirectory, options.intent),
    cwd: options.projectRoot,
    ...(environment.env === undefined ? {} : { env: environment.env }),
  });
  if (result.exitCode !== 0) return providerFailure();

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    return providerFailure('EAS_WEB_INVALID_RESULT', 'EAS Hosting returned an invalid result.');
  }
  const publication = parseEasWebPublication(
    parsed,
    options.revision,
    options.intent.mode === 'production',
  );
  return publication === null
    ? providerFailure('EAS_WEB_INVALID_RESULT', 'EAS Hosting returned an invalid result.')
    : { status: 'completed', publication };
}

function createDeployArgs(
  exportDirectory: string,
  intent: WebDeploymentPublishIntent,
): readonly string[] {
  const args = ['deploy', '--json', '--non-interactive', '--export-dir', exportDirectory];
  if (intent.mode === 'production') args.push('--prod');
  if (intent.alias !== undefined) args.push('--alias', intent.alias);
  if (intent.environment !== undefined) args.push('--environment', intent.environment);
  return args;
}

function isValidIntent(intent: WebDeploymentPublishIntent): boolean {
  return (
    (intent.alias === undefined || intent.alias.trim().length > 0) &&
    (intent.environment === undefined || intent.environment.trim().length > 0)
  );
}

function invalidIntentFailure(): EasWebPublishResult {
  return providerFailure('INVALID_WEB_PUBLISH_INTENT', 'Web publish intent is invalid.');
}

function providerFailure(
  code = 'EAS_WEB_PUBLISH_FAILED',
  message = 'EAS Hosting publication failed.',
): EasWebPublishResult {
  return {
    status: 'failed',
    failure: { code, message, target: 'web', provider: 'eas' },
  };
}
