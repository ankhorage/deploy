import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

import type { DeploymentCapability } from '../domain/DeploymentCapability';
import type { DeploymentProviderSetupInspectionResult } from '../domain/DeploymentProviderSetupInspectionResult';
import type { DeploymentProvisioningRequirement } from '../domain/DeploymentProvisioningRequirement';
import type { DeploymentStepOutcome } from '../domain/DeploymentStepOutcome';

export interface ProjectSetupBlockingOptions {
  readonly target: AppDeployTargetId;
  readonly capability: DeploymentCapability;
  readonly incompleteCode: string;
  readonly incompleteMessage: string;
  readonly unavailableCode: string;
  readonly unavailableMessage: string;
}

export function projectSetupBlockingOutcome(
  result: DeploymentProviderSetupInspectionResult,
  options: ProjectSetupBlockingOptions,
): DeploymentStepOutcome | null {
  if (!result.ok) return { status: 'failed', error: result.failure };
  if (result.inspection.authentication.status === 'required') {
    return { status: 'action-required', action: result.inspection.authentication.action };
  }
  const [requirement] = result.inspection.provisioning;
  if (requirement !== undefined) return provisioningOutcome(requirement, options);
  const capability = result.inspection.capabilities.find(
    (item) => item.capability === options.capability,
  );
  return capability?.status === 'available' ? null : unavailable(result, options);
}

function provisioningOutcome(
  requirement: DeploymentProvisioningRequirement,
  options: ProjectSetupBlockingOptions,
): DeploymentStepOutcome {
  if (requirement.type === 'authentication' || requirement.type === 'manual-action') {
    return { status: 'action-required', action: requirement.action };
  }
  return {
    status: 'failed',
    error: {
      code: options.incompleteCode,
      message: options.incompleteMessage,
      target: options.target,
      provider: requirement.provider,
    },
  };
}

function unavailable(
  result: Extract<DeploymentProviderSetupInspectionResult, { readonly ok: true }>,
  options: ProjectSetupBlockingOptions,
): DeploymentStepOutcome {
  return {
    status: 'failed',
    error: {
      code: options.unavailableCode,
      message: options.unavailableMessage,
      target: options.target,
      provider: result.inspection.provider,
    },
  };
}
