import type { AnkhCommandPlan } from '@ankhorage/ankh';

import type { DeployCliInput } from './DeployCliInput.js';
import type { DeployCliRuntime } from './DeployCliRuntime.js';
import { inspectDeployCliRelease } from './inspectDeployCliRelease.js';
import { mapDeployCliPlan } from './mapDeployCliPlan.js';
import { parseDeployCliOptions } from './parseDeployCliOptions.js';
import { redactDeployCliText } from './redactDeployCliText.js';

export async function handleDeployCliPlan(
  input: DeployCliInput,
  runtime: DeployCliRuntime,
): Promise<AnkhCommandPlan> {
  const parsed = parseDeployCliOptions(input.argv, input.context.cwd);
  if (!parsed.ok) {
    return failedPlan('DEPLOY_CLI_INVALID_ARGUMENT', parsed.message, input.context.env);
  }
  const result = await inspectDeployCliRelease(parsed.options, input.context.env, runtime);
  if (!result.ok) return failedPlan(result.failure.code, result.failure.message, input.context.env);
  return mapDeployCliPlan(result.inspection, result.plan, input.context.env);
}

function failedPlan(
  code: string,
  message: string,
  env: Readonly<Record<string, string | undefined>>,
): AnkhCommandPlan {
  return {
    kind: 'ankh-command-plan',
    version: 1,
    title: 'Deploy release',
    steps: [],
    diagnostics: [{ code, message: redactDeployCliText(message, env), severity: 'error' }],
  };
}
