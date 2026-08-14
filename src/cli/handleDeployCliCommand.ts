import type { AnkhCliRunResult, AnkhConfirmationResult } from '@ankhorage/ankh';

import type { DeploymentFailure, ReleasePlan } from '../index.js';
import { createDeployCliConfirmationEnvelope } from './createDeployCliConfirmationEnvelope.js';
import { createDeployCliExecutionEnvelope } from './createDeployCliExecutionEnvelope.js';
import { createDeployCliFailureEnvelope } from './createDeployCliFailureEnvelope.js';
import { createDeployCliPlanEnvelope } from './createDeployCliPlanEnvelope.js';
import { DEPLOY_CLI_EXIT_CODES } from './DeployCliExitCodes.js';
import type { DeployCliInput } from './DeployCliInput.js';
import type { DeployCliInspectionResult } from './DeployCliInspectionResult.js';
import type { DeployCliOptions } from './DeployCliOptions.js';
import type { DeployCliRuntime } from './DeployCliRuntime.js';
import { getDeployCliExecutionOutcome } from './getDeployCliExecutionOutcome.js';
import { getDeployCliPlanOutcome } from './getDeployCliPlanOutcome.js';
import { inspectDeployCliRelease } from './inspectDeployCliRelease.js';
import { parseDeployCliOptions } from './parseDeployCliOptions.js';
import { renderDeployCliExecution } from './renderDeployCliExecution.js';
import { renderDeployCliFailure } from './renderDeployCliFailure.js';
import { renderDeployCliPlan } from './renderDeployCliPlan.js';
import { writeDeployCliHuman } from './writeDeployCliHuman.js';
import { writeDeployCliJson } from './writeDeployCliJson.js';

type SuccessfulInspection = Extract<DeployCliInspectionResult, { readonly ok: true }>;

export async function handleDeployCliCommand(
  input: DeployCliInput,
  runtime: DeployCliRuntime,
): Promise<AnkhCliRunResult> {
  const parsed = parseDeployCliOptions(input.argv, input.context.cwd);
  if (!parsed.ok) {
    return reportFailure(input, requestedFormat(input.argv), 'input', {
      code: 'DEPLOY_CLI_INVALID_ARGUMENT',
      message: parsed.message,
    });
  }
  const inspected = await inspectDeployCliRelease(parsed.options, input.context.env, runtime);
  if (!inspected.ok)
    return reportFailure(input, parsed.options.format, 'inspect', inspected.failure);
  return handleInspectedDeploy(input, parsed.options, inspected, runtime);
}

async function handleInspectedDeploy(
  input: DeployCliInput,
  options: DeployCliOptions,
  inspected: SuccessfulInspection,
  runtime: DeployCliRuntime,
): Promise<AnkhCliRunResult> {
  if (options.format === 'human') {
    writeDeployCliHuman(input, 'stdout', renderDeployCliPlan(inspected.inspection, inspected.plan));
  }
  const outcome = getDeployCliPlanOutcome(inspected.inspection, inspected.plan);
  if (options.dryRun || outcome.status !== 'planned') {
    return reportPlanOutcome(input, options, inspected, outcome);
  }
  if (options.format === 'json' && !options.yes) {
    writeDeployCliJson(
      input,
      createDeployCliConfirmationEnvelope(inspected.inspection, inspected.plan, input.context.env),
    );
    return { exitCode: DEPLOY_CLI_EXIT_CODES.confirmationRequired };
  }
  return confirmAndExecute(input, options, inspected, runtime);
}

async function confirmAndExecute(
  input: DeployCliInput,
  options: DeployCliOptions,
  inspected: SuccessfulInspection,
  runtime: DeployCliRuntime,
): Promise<AnkhCliRunResult> {
  const confirmation = await confirmMutation(input, options, inspected.plan);
  if (confirmation === 'declined') {
    writeDeployCliHuman(input, 'stderr', 'Deployment cancelled; no mutation was performed.\n');
    return { exitCode: DEPLOY_CLI_EXIT_CODES.declined };
  }
  if (confirmation !== 'confirmed') {
    writeDeployCliHuman(
      input,
      'stderr',
      'Deployment requires confirmation. Use --yes for explicit non-interactive approval or --dry-run to inspect only.\n',
    );
    return { exitCode: DEPLOY_CLI_EXIT_CODES.confirmationRequired };
  }
  return executeDeploy(input, options, inspected, runtime);
}

async function executeDeploy(
  input: DeployCliInput,
  options: DeployCliOptions,
  inspected: SuccessfulInspection,
  runtime: DeployCliRuntime,
): Promise<AnkhCliRunResult> {
  const executionId = options.executionId ?? runtime.createExecutionId();
  const executed = await runtime.executeProjectRelease({
    ...inspected.access,
    inspection: inspected.inspection,
    plan: inspected.plan,
    executionId,
  });
  if (!executed.ok) return reportFailure(input, options.format, 'execute', executed.failure);
  const outcome = getDeployCliExecutionOutcome(executed.execution);
  if (options.format === 'json') {
    writeDeployCliJson(
      input,
      createDeployCliExecutionEnvelope(
        inspected.inspection,
        executed.execution,
        executionId,
        outcome,
        input.context.env,
      ),
    );
  } else {
    writeDeployCliHuman(input, 'stdout', renderDeployCliExecution(executed.execution, executionId));
  }
  return { exitCode: outcome.exitCode };
}

function reportPlanOutcome(
  input: DeployCliInput,
  options: DeployCliOptions,
  inspected: SuccessfulInspection,
  outcome: ReturnType<typeof getDeployCliPlanOutcome>,
): AnkhCliRunResult {
  if (options.format === 'json') {
    writeDeployCliJson(
      input,
      createDeployCliPlanEnvelope(inspected.inspection, inspected.plan, outcome, input.context.env),
    );
  }
  return { exitCode: outcome.exitCode };
}

function reportFailure(
  input: DeployCliInput,
  format: 'human' | 'json',
  phase: 'input' | 'inspect' | 'execute',
  failure: DeploymentFailure,
): AnkhCliRunResult {
  if (format === 'json') {
    writeDeployCliJson(input, createDeployCliFailureEnvelope(phase, failure, input.context.env));
  } else {
    writeDeployCliHuman(input, 'stderr', renderDeployCliFailure(failure));
  }
  return { exitCode: DEPLOY_CLI_EXIT_CODES.failure };
}

async function confirmMutation(
  input: DeployCliInput,
  options: DeployCliOptions,
  plan: ReleasePlan,
): Promise<AnkhConfirmationResult> {
  if (options.yes) return 'confirmed';
  const { interaction } = input.context;
  if (interaction === undefined) return 'unavailable';
  const irreversible = plan.steps.filter((step) => step.irreversible).length;
  const detail = irreversible === 0 ? '' : ` (${irreversible} irreversible)`;
  return interaction.confirm(`Execute ${plan.steps.length} release step(s)${detail}?`);
}

function requestedFormat(argv: readonly string[]): 'human' | 'json' {
  return argv.includes('--json') ? 'json' : 'human';
}
