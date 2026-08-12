import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentAuthenticationRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';

export type EasProcessEnvironmentResult =
  | { readonly ok: true; readonly env?: Readonly<Record<string, string>> }
  | { readonly ok: false; readonly action: DeploymentAuthenticationRequiredAction };

export async function resolveEasProcessEnvironment(options: {
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
}): Promise<EasProcessEnvironmentResult> {
  const reference = options.credentials.find(
    (credential) => credential.provider === 'eas' && credential.kind === 'expo-token',
  );
  if (reference === undefined) return { ok: true };

  let token: string | null;
  try {
    token = await options.resolveSecret(reference);
  } catch {
    token = null;
  }
  if (token !== null && token.length > 0) {
    return { ok: true, env: { EXPO_TOKEN: token } };
  }
  return {
    ok: false,
    action: {
      type: 'authentication',
      provider: 'eas',
      target: 'web',
      code: 'EAS_AUTHENTICATION_REQUIRED',
      message: 'EAS authentication is required for Web deployment.',
    },
  };
}
