/**
 * Stable process exit codes for `ankh deploy`.
 *
 * - `success`: completed, no-change, or a clean dry-run plan.
 * - `failure`: invalid input, inspection/execution failure, or history write failure.
 * - `blocked`: blocked, waiting, or action-required state.
 * - `confirmationRequired`: mutation needs explicit approval.
 * - `declined`: an interactive user explicitly declined mutation.
 * - `drifted`: provider/project state changed after planning.
 */
export const DEPLOY_CLI_EXIT_CODES = {
  success: 0,
  failure: 1,
  blocked: 2,
  confirmationRequired: 3,
  declined: 4,
  drifted: 5,
} as const;
