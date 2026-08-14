import type { DEPLOY_CLI_EXIT_CODES } from './DeployCliExitCodes.js';

/** Stable `ankh deploy` process exit-code union. */
export type DeployCliExitCode = (typeof DEPLOY_CLI_EXIT_CODES)[keyof typeof DEPLOY_CLI_EXIT_CODES];
