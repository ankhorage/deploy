import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

export interface DeploymentVerificationIssue {
  readonly code: string;
  readonly message: string;
  readonly target?: AppDeployTargetId;
  readonly provider?: string;
}

export type DeploymentVerificationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly issues: readonly DeploymentVerificationIssue[] };
