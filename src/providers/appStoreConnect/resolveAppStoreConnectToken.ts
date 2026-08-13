import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentAuthenticationRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type {
  AppStoreConnectApiKeyCredentials,
  AppStoreConnectTokenFactory,
} from './AppStoreConnectTokenFactory';

export type AppStoreConnectTokenResult =
  | { readonly ok: true; readonly token: string }
  | { readonly ok: false; readonly action: DeploymentAuthenticationRequiredAction };

export async function resolveAppStoreConnectToken(options: {
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: AppStoreConnectTokenFactory;
  readonly now: Date;
}): Promise<AppStoreConnectTokenResult> {
  const reference = options.credentials.find(
    (credential) => credential.provider === 'app-store-connect' && credential.kind === 'api-key',
  );
  if (reference === undefined) return requiredAction();
  const secret = await safelyResolve(options.resolveSecret, reference);
  const parsed = parseApiKey(secret);
  if (parsed === null) return requiredAction();
  const token = await safelyCreateToken(options.createToken, parsed, options.now);
  return token === null ? requiredAction() : { ok: true, token };
}

function parseApiKey(value: string | null): AppStoreConnectApiKeyCredentials | null {
  if (value === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (!isNonEmptyString(parsed.keyId) || !isNonEmptyString(parsed.issuerId)) return null;
  if (!isNonEmptyString(parsed.privateKey)) return null;
  return { keyId: parsed.keyId, issuerId: parsed.issuerId, privateKey: parsed.privateKey };
}

async function safelyResolve(
  resolveSecret: DeploymentSecretResolver,
  reference: DeploymentCredentialReference,
): Promise<string | null> {
  try {
    return await resolveSecret(reference);
  } catch {
    return null;
  }
}

async function safelyCreateToken(
  createToken: AppStoreConnectTokenFactory,
  credentials: AppStoreConnectApiKeyCredentials,
  now: Date,
): Promise<string | null> {
  try {
    return await createToken(credentials, now);
  } catch {
    return null;
  }
}

function requiredAction(): AppStoreConnectTokenResult {
  return {
    ok: false,
    action: {
      type: 'authentication',
      provider: 'app-store-connect',
      target: 'ios',
      code: 'APP_STORE_CONNECT_AUTHENTICATION_REQUIRED',
      message: 'App Store Connect API-key authentication is required for iOS deployment.',
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
