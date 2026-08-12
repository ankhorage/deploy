import { DEPLOYMENT_CAPABILITIES, type DeploymentCapability } from '../../domain/DeploymentCapability';
import type { DeploymentProviderCapabilityState } from '../../domain/DeploymentProviderCapabilityState';
import { isNonEmptyString } from './isNonEmptyString';
import { isRecord } from './isRecord';

export function normalizeProviderCapabilityStates(
  value: unknown,
): readonly DeploymentProviderCapabilityState[] | null {
  if (!Array.isArray(value)) return null;

  const seen = new Set<DeploymentCapability>();
  const states: DeploymentProviderCapabilityState[] = [];
  for (const raw of value) {
    if (!isRecord(raw) || !isCapability(raw.capability) || seen.has(raw.capability)) return null;
    if (raw.status !== 'available' && raw.status !== 'unavailable') return null;
    if (raw.reason !== undefined && !isNonEmptyString(raw.reason)) return null;
    seen.add(raw.capability);
    states.push({
      capability: raw.capability,
      status: raw.status,
      ...(raw.reason === undefined ? {} : { reason: raw.reason }),
    });
  }
  return states.sort((left, right) => capabilityIndex(left.capability) - capabilityIndex(right.capability));
}

function isCapability(value: unknown): value is DeploymentCapability {
  return DEPLOYMENT_CAPABILITIES.some((capability) => capability === value);
}

function capabilityIndex(capability: DeploymentCapability): number {
  return DEPLOYMENT_CAPABILITIES.indexOf(capability);
}
