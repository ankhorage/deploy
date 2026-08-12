import { APP_DEPLOY_TARGET_IDS, type AppDeployTargetId } from '@ankhorage/contracts/deploy';

export function isAppDeployTargetId(value: unknown): value is AppDeployTargetId {
  return APP_DEPLOY_TARGET_IDS.some((target) => target === value);
}
