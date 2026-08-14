import type { DeploymentRequiredAction } from '../index.js';
import { redactDeployCliText } from './redactDeployCliText.js';

export function redactDeployCliActions(
  actions: readonly DeploymentRequiredAction[],
  env: Readonly<Record<string, string | undefined>>,
): readonly DeploymentRequiredAction[] {
  return actions.map((action) => ({
    ...action,
    message: redactDeployCliText(action.message, env),
    ...('url' in action ? { url: redactDeployCliText(action.url, env) } : {}),
  }));
}
