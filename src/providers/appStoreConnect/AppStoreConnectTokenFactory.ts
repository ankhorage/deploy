import { sign } from 'node:crypto';

export interface AppStoreConnectApiKeyCredentials {
  readonly keyId: string;
  readonly issuerId: string;
  readonly privateKey: string;
}

export type AppStoreConnectTokenFactory = (
  credentials: AppStoreConnectApiKeyCredentials,
  now: Date,
) => Promise<string | null>;

export const createAppStoreConnectToken: AppStoreConnectTokenFactory = (credentials, now) => {
  const issuedAt = Math.floor(now.getTime() / 1000);
  const header = encode({ alg: 'ES256', kid: credentials.keyId, typ: 'JWT' });
  const payload = encode({
    iss: credentials.issuerId,
    iat: issuedAt,
    exp: issuedAt + 600,
    aud: 'appstoreconnect-v1',
  });
  const input = `${header}.${payload}`;
  const signature = sign('sha256', Buffer.from(input), {
    key: credentials.privateKey,
    dsaEncoding: 'ieee-p1363',
  });
  return Promise.resolve(`${input}.${signature.toString('base64url')}`);
};

function encode(value: Readonly<Record<string, string | number>>): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
