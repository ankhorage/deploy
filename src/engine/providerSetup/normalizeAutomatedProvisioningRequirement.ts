import type { DeploymentProvisioningRequirement } from '../../domain/DeploymentProvisioningRequirement';
import { isAppDeployTargetId } from './isAppDeployTargetId';
import { isNonEmptyString } from './isNonEmptyString';

export function normalizeAutomatedProvisioningRequirement(
  value: Record<string, unknown>,
  provider: string,
  seen: Set<string>,
): DeploymentProvisioningRequirement | null {
  if (
    value.type !== 'automated' ||
    value.provider !== provider ||
    !isNonEmptyString(value.id) ||
    seen.has(value.id) ||
    !isNonEmptyString(value.code) ||
    !isNonEmptyString(value.message) ||
    (value.target !== undefined && !isAppDeployTargetId(value.target))
  ) {
    return null;
  }
  seen.add(value.id);
  return {
    type: 'automated',
    id: value.id,
    provider,
    code: value.code,
    message: value.message,
    ...(value.target === undefined ? {} : { target: value.target }),
  };
}
