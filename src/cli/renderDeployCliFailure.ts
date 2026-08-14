import type { DeploymentFailure } from '../index.js';

export function renderDeployCliFailure(failure: DeploymentFailure): string {
  const scope = [failure.target, failure.provider].filter(
    (value): value is string => value !== undefined,
  );
  const suffix = scope.length === 0 ? '' : ` (${scope.join(' | ')})`;
  return `Deploy failed: ${failure.code}: ${failure.message}${suffix}\n`;
}
