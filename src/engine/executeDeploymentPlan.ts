import type {
  DeploymentExecutionResult,
  DeploymentStepExecutionRecord,
} from '../domain/DeploymentExecutionResult';
import type { DeploymentPlan } from '../domain/DeploymentPlan';
import type { DeploymentPlanStep } from '../domain/DeploymentPlanStep';
import type { DeploymentStepOutcome } from '../domain/DeploymentStepOutcome';

export type DeploymentStepExecutor = (step: DeploymentPlanStep) => Promise<DeploymentStepOutcome>;

export interface ExecuteDeploymentPlanInput {
  readonly plan: DeploymentPlan;
  readonly executeStep: DeploymentStepExecutor;
}

export async function executeDeploymentPlan(
  input: ExecuteDeploymentPlanInput,
): Promise<DeploymentExecutionResult> {
  if (!input.plan.executable) {
    return { status: 'blocked', diagnostics: input.plan.diagnostics, records: [] };
  }

  const records: DeploymentStepExecutionRecord[] = [];
  for (const step of input.plan.steps) {
    const outcome = await safelyExecuteStep(step, input.executeStep);
    records.push({ step, outcome });
    if (outcome.status === 'action-required') {
      return { status: 'action-required', action: outcome.action, records };
    }
    if (outcome.status === 'failed') {
      return { status: 'failed', failure: outcome.error, records };
    }
  }
  return { status: 'completed', records };
}

async function safelyExecuteStep(
  step: DeploymentPlanStep,
  executeStep: DeploymentStepExecutor,
): Promise<DeploymentStepOutcome> {
  try {
    return await executeStep(step);
  } catch {
    return {
      status: 'failed',
      error: {
        code: 'STEP_EXECUTOR_THROWN',
        message: 'Deployment step executor threw an exception.',
        target: step.target,
        ...(step.provider === undefined ? {} : { provider: step.provider }),
      },
    };
  }
}
