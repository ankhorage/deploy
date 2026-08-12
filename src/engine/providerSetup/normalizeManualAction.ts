import type { DeploymentManualAction } from '../../domain/DeploymentRequiredAction';
import { isAppDeployTargetId } from './isAppDeployTargetId';
import { isNonEmptyString } from './isNonEmptyString';
import { isRecord } from './isRecord';

export function normalizeManualAction(
  value: unknown,
  provider: string,
): DeploymentManualAction | null {
  if (
    !isRecord(value) ||
    value.type !== 'manual-action' ||
    !isAppDeployTargetId(value.target) ||
    !isNonEmptyString(value.code) ||
    !isNonEmptyString(value.message) ||
    (value.provider !== undefined && value.provider !== provider) ||
    (value.url !== undefined && !isNonEmptyString(value.url))
  ) {
    return null;
  }

  return {
    type: 'manual-action',
    target: value.target,
    code: value.code,
    message: value.message,
    ...(value.provider === undefined ? {} : { provider }),
    ...(value.url === undefined ? {} : { url: value.url }),
  };
}
