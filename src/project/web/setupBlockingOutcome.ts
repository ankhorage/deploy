import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import type { DeploymentStepOutcome } from '../../domain/DeploymentStepOutcome';

export function setupBlockingOutcome(
  result: DeploymentProviderSetupInspectionResult,
): DeploymentStepOutcome | null {
  if (!result.ok) return { status: 'failed', error: result.failure };
  if (result.inspection.authentication.status === 'required') {
    return { status: 'action-required', action: result.inspection.authentication.action };
  }
  for (const requirement of result.inspection.provisioning) {
    if (requirement.type === 'authentication' || requirement.type === 'manual-action') {
      return { status: 'action-required', action: requirement.action };
    }
    return {
      status: 'failed',
      error: {
        code: 'WEB_SETUP_INCOMPLETE',
        message: 'Web deployment setup requires automated provisioning before publication.',
        target: 'web',
        provider: requirement.provider,
      },
    };
  }
  const publish = result.inspection.capabilities.find(
    (capability) => capability.capability === 'publish',
  );
  return publish?.status === 'available'
    ? null
    : {
        status: 'failed',
        error: {
          code: 'WEB_PUBLISH_UNAVAILABLE',
          message: 'The Web publish capability is not available.',
          target: 'web',
          provider: result.inspection.provider,
        },
      };
}
