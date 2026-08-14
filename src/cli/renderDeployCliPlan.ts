import type { ReleasePlan, ReleasePlanStep } from '../index.js';
import type { ProjectReleaseInspection } from '../project/index.js';

export function renderDeployCliPlan(
  inspection: ProjectReleaseInspection,
  plan: ReleasePlan,
  format: 'human' | 'json',
): string {
  if (format === 'json') {
    return `${JSON.stringify({
      kind: 'deploy-release-plan',
      desired: inspection.desired,
      plan,
      actions: inspection.actions,
    })}\n`;
  }
  return renderHuman(inspection, plan);
}

function renderHuman(inspection: ProjectReleaseInspection, plan: ReleasePlan): string {
  const lines = [
    `Release: ${inspection.desired.version}`,
    `Targets: ${inspection.desired.targets.join(', ')}`,
    `Revision: ${inspection.desired.revision}`,
    `Plan status: ${plan.status}`,
    '',
    'Steps:',
  ];
  if (plan.steps.length === 0) lines.push('  - none');
  plan.steps.forEach((step, index) => lines.push(...renderStep(step, index)));
  lines.push('', 'Diagnostics:');
  if (plan.diagnostics.length === 0) lines.push('  - none');
  for (const diagnostic of plan.diagnostics) {
    const target = diagnostic.target === undefined ? '' : ` [${diagnostic.target}]`;
    lines.push(`  [${diagnostic.severity}]${target} ${diagnostic.code}: ${diagnostic.message}`);
  }
  lines.push('', 'Required actions:');
  if (inspection.actions.length === 0) lines.push('  - none');
  for (const action of inspection.actions) {
    const target = action.target === undefined ? '' : ` [${action.target}]`;
    lines.push(`  ${action.type}${target} ${action.code}: ${action.message}`);
  }
  lines.push('');
  return lines.join('\n');
}

function renderStep(step: ReleasePlanStep, index: number): string[] {
  return [
    `  ${index + 1}. [${step.target}] ${step.operation}`,
    `     id: ${step.id}`,
    `     dependsOn: ${step.dependsOn.length === 0 ? 'none' : step.dependsOn.join(', ')}`,
    `     irreversible: ${step.irreversible ? 'yes' : 'no'}`,
    `     retry: ${step.retry}`,
  ];
}
