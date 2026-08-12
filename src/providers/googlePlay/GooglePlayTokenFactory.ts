import { GoogleAuth } from 'google-auth-library';

const GOOGLE_PLAY_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

export interface GooglePlayServiceAccountCredentials {
  readonly clientEmail: string;
  readonly privateKey: string;
}

export type GooglePlayTokenFactory = (
  credentials: GooglePlayServiceAccountCredentials,
) => Promise<string | null>;

export const createGooglePlayAccessToken: GooglePlayTokenFactory = async (credentials) => {
  const auth = new GoogleAuth({
    credentials: {
      client_email: credentials.clientEmail,
      private_key: credentials.privateKey,
    },
    scopes: [GOOGLE_PLAY_SCOPE],
  });
  const token = await auth.getAccessToken();
  return typeof token === 'string' && token.length > 0 ? token : null;
};
