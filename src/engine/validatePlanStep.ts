import type { DeploymentPlanDiagnostic } from '../domain/DeploymentPlanDiagnostic';
import type { DeploymentPlanStep } from '../domain/DeploymentPlanStep';
import type { DeploymentTargetChange } from '../domain/DeploymentTargetChange';
import type { DeploymentTargetPlanContributor } from '../domain/DeploymentTargetPlanContributor';

export function validatePlanStep(
  step: DeploymentPlanStep,
  change: DeploymentTargetChange,
  contributor: DeploymentTargetPlanContributor,
  stepIds: ReadonlySet<string>,
): DeploymentPlanDiagnostic | null {
  if (step.id.trim().length === 0) {
    return diagnostic('INVALID_STEP_ID', change, 'Deployment plan step IDs must be non-empty.');
  }
  if (step.target !== change.target) {
    return diagnostic(
      'STEP_TARGET_MISMATCH',
      change,
      'A target planner emitted a step for another target.',
      step.id,
    );
  }
  if (!contributor.capabilities.includes(step.phase)) {
    return diagnostic(
      'UNDECLARED_CAPABILITY',
      change,
      'A plan step uses a capability not declared by its contributor.',
      step.id,
    );
  }
  if (stepIds.has(step.id)) {
    return diagnostic(
      'DUPLICATE_STEP_ID',
      change,
      'Deployment plan step IDs must be globally unique.',
      step.id,
    );
  }
  return null;
}

function diagnostic(
  code: DeploymentPlanDiagnostic['code'],
  change: DeploymentTargetChange,
  message: string,
  stepId?: string,
): DeploymentPlanDiagnostic {
  return { code, target: change.target, message, ...(stepId === undefined ? {} : { stepId }) };
}
