/**
 * Transient environment inputs understood by `ankh deploy`.
 *
 * Credential values have no CLI-flag equivalent and never enter authored
 * release state. Google Play expects the complete service-account JSON string;
 * App Store Connect expects JSON with `keyId`, `issuerId`, and `privateKey`;
 * EAS expects the raw Expo access token.
 *
 * Operational input precedence is explicit:
 * - `--project-root` overrides the command-context cwd.
 * - `--execution-id` overrides generated execution ids.
 * - Android track has no default; an Android build profile requires a track.
 * - build profiles and Web alias/environment are CLI-only runtime inputs.
 *
 * CI examples:
 * `ankh deploy --dry-run --json --android-track internal`
 * `ankh deploy --yes --json --execution-id "$GITHUB_RUN_ID" --android-track production`
 *
 * `--json` writes exactly one versioned document to stdout and never prompts;
 * mutation in JSON/CI mode therefore requires explicit `--yes`.
 */
export const DEPLOY_CLI_ENVIRONMENT = {
  googlePlayServiceAccountJson: 'ANKH_DEPLOY_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON',
  appStoreConnectApiKeyJson: 'ANKH_DEPLOY_APP_STORE_CONNECT_API_KEY_JSON',
  easToken: 'ANKH_DEPLOY_EAS_TOKEN',
} as const;
