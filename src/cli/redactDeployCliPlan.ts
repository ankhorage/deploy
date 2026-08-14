import type { ReleasePlan } from '../index.js';
import { redactDeployCliText } from './redactDeployCliText.js';

export function redactDeployCliPlan(
  plan: ReleasePlan,
  env: Readonly<Record<string, string | undefined>>,
): ReleasePlan {
  return {
    ...plan,
    diagnostics: plan.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      message: redactDeployCliText(diagnostic.message, env),
    })),
  };
}
