import type { AnkhCommandPlan } from '@ankhorage/ankh';

import type { ReleasePlan } from '../index.js';
import type { ProjectReleaseInspection } from '../project/index.js';

export function mapDeployCliPlan(
  inspection: ProjectReleaseInspection,
  plan: ReleasePlan,
): AnkhCommandPlan {
  return {
    kind: 'ankh-command-plan',
    version: 1,
    title: `Deploy release ${inspection.desired.version}`,
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
        message: diagnostic.message,
        severity: diagnostic.severity,
      })),
      ...inspection.actions.map((action) => ({
        code: action.code,
        message: action.message,
        severity: 'warning' as const,
      })),
    ],
  };
}
