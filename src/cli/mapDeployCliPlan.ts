import type { AnkhCommandPlan } from '@ankhorage/ankh';

import type { ReleasePlan } from '../index.js';
import type { ProjectReleaseInspection } from '../project/index.js';
import { redactDeployCliText } from './redactDeployCliText.js';

export function mapDeployCliPlan(
  inspection: ProjectReleaseInspection,
  plan: ReleasePlan,
  env: Readonly<Record<string, string | undefined>>,
): AnkhCommandPlan {
  return {
    kind: 'ankh-command-plan',
    version: 1,
    title: `Deploy release ${redactDeployCliText(inspection.desired.version, env)}`,
    steps: plan.steps.map((step) => ({
      capability: 'deploy.execute',
      dependsOn: step.dependsOn,
      destructive: step.irreversible,
      id: step.id,
      label: `[${step.target}] ${step.operation}`,
      providerId: '@ankhorage/deploy',
      status: plan.status === 'blocked' ? 'blocked' : 'planned',
    })),
    diagnostics: [
      ...plan.diagnostics.map((diagnostic) => ({
        code: diagnostic.code,
        message: redactDeployCliText(diagnostic.message, env),
        severity: diagnostic.severity,
      })),
      ...inspection.actions.map((action) => ({
        code: action.code,
        message: redactDeployCliText(action.message, env),
        severity: 'warning' as const,
      })),
    ],
  };
}
