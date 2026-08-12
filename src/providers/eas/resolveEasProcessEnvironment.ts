import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentAuthenticationRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';

export type EasProcessEnvironmentResult =
  | { readonly ok: true; readonly env?: Readonly<Record<string, string>> }
  | { readonly ok: false; readonly action: DeploymentAuthenticationRequiredAction };

export async function resolveEasProcessEnvironment(options: {
  readonly target: AppDeployTargetId;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
}): Promise<EasProcessEnvironmentResult> {
  const reference = options.credentials.find(
    (credential) => credential.provider === 'eas' && credential.kind === 'expo-token',
  );
  if (reference === undefined) return { ok: true };

  const token = await safelyResolveToken(options.resolveSecret, reference);
  if (token !== null && token.length > 0) return { ok: true, env: { EXPO_TOKEN: token } };
  return { ok: false, action: authenticationAction(options.target) };
}

async function safelyResolveToken(
  resolveSecret: DeploymentSecretResolver,
  reference: DeploymentCredentialReference,
): Promise<string | null> {
  try {
    return await resolveSecret(reference);
  } catch {
    return null;
  }
}

function authenticationAction(target: AppDeployTargetId): DeploymentAuthenticationRequiredAction {
  return {
    type: 'authentication',
    provider: 'eas',
    target,
    code: 'EAS_AUTHENTICATION_REQUIRED',
    message: `EAS authentication is required for ${target} deployment.`,
  };
}
