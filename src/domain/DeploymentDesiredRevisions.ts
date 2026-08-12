import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

export type DeploymentDesiredRevisions = Partial<Record<AppDeployTargetId, string>>;
