import type { AnkhCliRunResult, AnkhConfirmationResult } from '@ankhorage/ankh';

import type { ReleasePlan } from '../index.js';
import type { DeployCliInput } from './DeployCliInput.js';
import type { DeployCliOptions } from './DeployCliOptions.js';
import type { DeployCliRuntime } from './DeployCliRuntime.js';
import { inspectDeployCliRelease } from './inspectDeployCliRelease.js';
import { parseDeployCliOptions } from './parseDeployCliOptions.js';
import { renderDeployCliExecution } from './renderDeployCliExecution.js';
import { renderDeployCliFailure } from './renderDeployCliFailure.js';
import { renderDeployCliPlan } from './renderDeployCliPlan.js';

export async function handleDeployCliCommand(
  input: DeployCliInput,
  runtime: DeployCliRuntime,
): Promise<AnkhCliRunResult> {
  const parsed = parseDeployCliOptions(input.argv, input.context.cwd);
  if (!parsed.ok) return fail(input, `Deploy CLI: ${parsed.message}\n`);
  const inspected = await inspectDeployCliRelease(parsed.options, input.context.env, runtime);
  if (!inspected.ok) return fail(input, renderDeployCliFailure(inspected.failure));

  input.context.writeStdout(
    renderDeployCliPlan(inspected.inspection, inspected.plan, parsed.options.format),
  );
  const early = earlyResult(parsed.options, inspected.plan);
  if (early !== null) return early;

  const confirmation = await confirmMutation(input, parsed.options, inspected.plan);
  if (confirmation === 'declined') {
    input.context.writeStderr('Deployment cancelled; no mutation was performed.\n');
    return { exitCode: 0 };
  }
  if (confirmation !== 'confirmed') {
    return fail(
      input,
      'Deployment requires confirmation. Use --yes for explicit non-interactive approval or --dry-run to inspect only.\n',
    );
  }

  const executionId = parsed.options.executionId ?? runtime.createExecutionId();
  const executed = await runtime.executeProjectRelease({
    ...inspected.access,
    inspection: inspected.inspection,
    plan: inspected.plan,
    executionId,
  });
  if (!executed.ok) return fail(input, renderDeployCliFailure(executed.failure));
  input.context.writeStdout(
    renderDeployCliExecution(executed.execution, executionId, parsed.options.format),
  );
  return { exitCode: executed.execution.result.status === 'completed' ? 0 : 1 };
}

function earlyResult(options: DeployCliOptions, plan: ReleasePlan): AnkhCliRunResult | null {
  if (options.dryRun) return { exitCode: plan.status === 'blocked' ? 1 : 0 };
  if (plan.status === 'no-change') return { exitCode: 0 };
  if (plan.status === 'blocked') return { exitCode: 1 };
  if (plan.steps.length === 0) return { exitCode: plan.status === 'waiting' ? 1 : 0 };
  return null;
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

function fail(input: DeployCliInput, message: string): AnkhCliRunResult {
  input.context.writeStderr(message);
  return { exitCode: 1 };
}
