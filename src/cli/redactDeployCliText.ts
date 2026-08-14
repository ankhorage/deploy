const SENSITIVE_KEYS = new Set([
  'privateKey',
  'private_key',
  'clientSecret',
  'client_secret',
  'secret',
  'token',
  'access_token',
  'refresh_token',
  'password',
  'passphrase',
]);

export function redactDeployCliText(
  text: string,
  env: Readonly<Record<string, string | undefined>>,
): string {
  const secrets = collectSecrets(env).sort((left, right) => right.length - left.length);
  return secrets.reduce((result, secret) => replaceSecret(result, secret), text);
}

function collectSecrets(env: Readonly<Record<string, string | undefined>>): string[] {
  const secrets = new Set<string>();
  addSecret(env.ANKH_DEPLOY_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON, secrets);
  addSecret(env.ANKH_DEPLOY_APP_STORE_CONNECT_API_KEY_JSON, secrets);
  addSecret(env.ANKH_DEPLOY_EAS_TOKEN, secrets);
  return [...secrets];
}

function addSecret(rawValue: string | undefined, secrets: Set<string>): void {
  const raw = rawValue?.trim();
  if (raw === undefined || raw.length === 0) return;
  secrets.add(raw);
  collectJsonSecrets(raw, secrets);
}

function collectJsonSecrets(raw: string, secrets: Set<string>): void {
  try {
    const parsed: unknown = JSON.parse(raw);
    visitJson(parsed, secrets);
  } catch {
    return;
  }
}

function visitJson(value: unknown, secrets: Set<string>): void {
  if (Array.isArray(value)) {
    value.forEach((item) => visitJson(item, secrets));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key) && typeof child === 'string' && child.length > 0) {
      secrets.add(child);
    }
    visitJson(child, secrets);
  }
}

function replaceSecret(text: string, secret: string): string {
  const escaped = JSON.stringify(secret).slice(1, -1);
  return text.split(secret).join('[REDACTED]').split(escaped).join('[REDACTED]');
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
