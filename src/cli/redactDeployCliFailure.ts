import type { DeploymentFailure } from '../index.js';
import { redactDeployCliText } from './redactDeployCliText.js';

export function redactDeployCliFailure(
  failure: DeploymentFailure,
  env: Readonly<Record<string, string | undefined>>,
): DeploymentFailure {
  return { ...failure, message: redactDeployCliText(failure.message, env) };
}
