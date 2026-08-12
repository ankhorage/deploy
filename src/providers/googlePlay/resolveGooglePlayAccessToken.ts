import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentAuthenticationRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type {
  GooglePlayServiceAccountCredentials,
  GooglePlayTokenFactory,
} from './GooglePlayTokenFactory';

export type GooglePlayAccessTokenResult =
  | { readonly ok: true; readonly token: string }
  | { readonly ok: false; readonly action: DeploymentAuthenticationRequiredAction };

export async function resolveGooglePlayAccessToken(options: {
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: GooglePlayTokenFactory;
}): Promise<GooglePlayAccessTokenResult> {
  const reference = options.credentials.find(
    (credential) => credential.provider === 'google-play' && credential.kind === 'service-account',
  );
  if (reference === undefined) return requiredAction();
  const secret = await safelyResolve(options.resolveSecret, reference);
  const parsed = parseServiceAccount(secret);
  if (parsed === null) return requiredAction();
  const token = await safelyCreateToken(options.createToken, parsed);
  return token === null ? requiredAction() : { ok: true, token };
}

function parseServiceAccount(value: string | null): GooglePlayServiceAccountCredentials | null {
  if (value === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || parsed.type !== 'service_account') return null;
  if (!isNonEmptyString(parsed.client_email) || !isNonEmptyString(parsed.private_key)) return null;
  return { clientEmail: parsed.client_email, privateKey: parsed.private_key };
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
  createToken: GooglePlayTokenFactory,
  credentials: GooglePlayServiceAccountCredentials,
): Promise<string | null> {
  try {
    return await createToken(credentials);
  } catch {
    return null;
  }
}

function requiredAction(): GooglePlayAccessTokenResult {
  return {
    ok: false,
    action: {
      type: 'authentication',
      provider: 'google-play',
      target: 'android',
      code: 'GOOGLE_PLAY_AUTHENTICATION_REQUIRED',
      message: 'Google Play service-account authentication is required for Android deployment.',
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
