/**
 * Transient environment inputs understood by `ankh deploy`.
 *
 * Google Play expects the complete service-account JSON string.
 * App Store Connect expects JSON containing keyId, issuerId and privateKey.
 * EAS expects the raw Expo access token.
 */
export const DEPLOY_CLI_ENVIRONMENT = {
  googlePlayServiceAccountJson: 'ANKH_DEPLOY_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON',
  appStoreConnectApiKeyJson: 'ANKH_DEPLOY_APP_STORE_CONNECT_API_KEY_JSON',
  easToken: 'ANKH_DEPLOY_EAS_TOKEN',
} as const;
