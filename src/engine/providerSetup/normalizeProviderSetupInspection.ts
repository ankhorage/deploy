import type { DeploymentProviderSetupInspection } from '../../domain/DeploymentProviderSetupInspection';
import { containsTrackedSecret } from './containsTrackedSecret';
import { isRecord } from './isRecord';
import { normalizeAuthenticationState } from './normalizeAuthenticationState';
import { normalizeProviderCapabilityStates } from './normalizeProviderCapabilityStates';
import { normalizeProvisioningRequirements } from './normalizeProvisioningRequirements';

export type ProviderSetupNormalizationResult =
  | { readonly ok: true; readonly inspection: DeploymentProviderSetupInspection }
  | { readonly ok: false; readonly unsafe: boolean };

export function normalizeProviderSetupInspection(
  value: unknown,
  provider: string,
  secrets: ReadonlySet<string>,
): ProviderSetupNormalizationResult {
  if (!isRecord(value) || value.provider !== provider) return { ok: false, unsafe: false };

  const authentication = normalizeAuthenticationState(value.authentication, provider);
  const capabilities = normalizeProviderCapabilityStates(value.capabilities);
  const provisioning = normalizeProvisioningRequirements(value.provisioning, provider);
  if (authentication === null || capabilities === null || provisioning === null) {
    return { ok: false, unsafe: false };
  }

  const inspection: DeploymentProviderSetupInspection = {
    provider,
    authentication,
    capabilities,
    provisioning,
  };
  return containsTrackedSecret(inspection, secrets)
    ? { ok: false, unsafe: true }
    : { ok: true, inspection };
}
