import type { DeploymentAuthenticationRequiredAction } from '../../domain/DeploymentRequiredAction';
import { isAppDeployTargetId } from './isAppDeployTargetId';
import { isNonEmptyString } from './isNonEmptyString';
import { isRecord } from './isRecord';

export function normalizeAuthenticationAction(
  value: unknown,
  provider: string,
): DeploymentAuthenticationRequiredAction | null {
  if (
    !isRecord(value) ||
    value.type !== 'authentication' ||
    value.provider !== provider ||
    !isNonEmptyString(value.code) ||
    !isNonEmptyString(value.message) ||
    (value.target !== undefined && !isAppDeployTargetId(value.target))
  ) {
    return null;
  }

  return {
    type: 'authentication',
    provider,
    code: value.code,
    message: value.message,
    ...(value.target === undefined ? {} : { target: value.target }),
  };
}
