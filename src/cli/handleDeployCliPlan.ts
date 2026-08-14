import type { AnkhCommandPlan } from '@ankhorage/ankh';

import type { DeployCliInput } from './DeployCliInput.js';
import type { DeployCliRuntime } from './DeployCliRuntime.js';
import { inspectDeployCliRelease } from './inspectDeployCliRelease.js';
import { mapDeployCliPlan } from './mapDeployCliPlan.js';
import { parseDeployCliOptions } from './parseDeployCliOptions.js';

export async function handleDeployCliPlan(
  input: DeployCliInput,
  runtime: DeployCliRuntime,
): Promise<AnkhCommandPlan> {
  const parsed = parseDeployCliOptions(input.argv, input.context.cwd);
  if (!parsed.ok) return failedPlan('DEPLOY_CLI_INVALID_ARGUMENT', parsed.message);
  const result = await inspectDeployCliRelease(parsed.options, input.context.env, runtime);
  if (!result.ok) return failedPlan(result.failure.code, result.failure.message);
  return mapDeployCliPlan(result.inspection, result.plan);
}

function failedPlan(code: string, message: string): AnkhCommandPlan {
  return {
    kind: 'ankh-command-plan',
    version: 1,
    title: 'Deploy release',
    steps: [],
    diagnostics: [{ code, message, severity: 'error' }],
  };
}
