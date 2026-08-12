import type { DeploymentProvisioningRequirement } from '../../domain/DeploymentProvisioningRequirement';
import { isRecord } from './isRecord';
import { normalizeAuthenticationAction } from './normalizeAuthenticationAction';
import { normalizeAutomatedProvisioningRequirement } from './normalizeAutomatedProvisioningRequirement';
import { normalizeManualAction } from './normalizeManualAction';

export function normalizeProvisioningRequirements(
  value: unknown,
  provider: string,
): readonly DeploymentProvisioningRequirement[] | null {
  if (!Array.isArray(value)) return null;
  const seenAutomatedIds = new Set<string>();
  const requirements: DeploymentProvisioningRequirement[] = [];

  for (const raw of value) {
    const requirement = normalizeRequirement(raw, provider, seenAutomatedIds);
    if (requirement === null) return null;
    requirements.push(requirement);
  }
  return requirements;
}

function normalizeRequirement(
  value: unknown,
  provider: string,
  seen: Set<string>,
): DeploymentProvisioningRequirement | null {
  if (!isRecord(value)) return null;
  if (value.type === 'authentication') {
    const action = normalizeAuthenticationAction(value.action, provider);
    return action === null ? null : { type: 'authentication', action };
  }
  if (value.type === 'manual-action') {
    const action = normalizeManualAction(value.action, provider);
    return action === null ? null : { type: 'manual-action', action };
  }
  return normalizeAutomatedProvisioningRequirement(value, provider, seen);
}
