import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import type { DeploymentStepOutcome } from '../../domain/DeploymentStepOutcome';
import { projectSetupBlockingOutcome } from '../setupBlockingOutcome';

export function setupBlockingOutcome(
  result: DeploymentProviderSetupInspectionResult,
): DeploymentStepOutcome | null {
  return projectSetupBlockingOutcome(result, {
    target: 'web',
    capability: 'publish',
    incompleteCode: 'WEB_SETUP_INCOMPLETE',
    incompleteMessage: 'Web deployment setup requires automated provisioning before publication.',
    unavailableCode: 'WEB_PUBLISH_UNAVAILABLE',
    unavailableMessage: 'The Web publish capability is not available.',
  });
}
