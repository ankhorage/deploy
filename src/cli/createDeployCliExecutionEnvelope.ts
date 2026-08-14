import type { ProjectReleaseExecution, ProjectReleaseInspection } from '../project/index.js';
import type { DeployCliExecutionOutcome } from './DeployCliExecutionOutcome.js';
import type { DeployCliJsonEnvelope } from './DeployCliJsonEnvelope.js';
import { redactDeployCliFailure } from './redactDeployCliFailure.js';
import { redactDeployCliPlan } from './redactDeployCliPlan.js';
import { redactDeployCliText } from './redactDeployCliText.js';

export function createDeployCliExecutionEnvelope(
  inspection: ProjectReleaseInspection,
  execution: ProjectReleaseExecution,
  executionId: string,
  outcome: DeployCliExecutionOutcome,
  env: Readonly<Record<string, string | undefined>>,
): DeployCliJsonEnvelope {
  return {
    kind: 'ankh-deploy-result',
    version: 1,
    phase: outcome.phase,
    status: outcome.status,
    exitCode: outcome.exitCode,
    release: {
      version: redactDeployCliText(inspection.desired.version, env),
      targets: inspection.desired.targets,
      revision: redactDeployCliText(inspection.desired.revision, env),
    },
    plan: redactDeployCliPlan(execution.result.plan, env),
    execution: {
      id: redactDeployCliText(executionId, env),
      status: execution.result.status,
      currentRevision: redactDeployCliText(execution.result.currentRevision, env),
      executedStepIds: execution.result.executedStepIds.map((id) => redactDeployCliText(id, env)),
      ...(execution.result.attemptedStepId === undefined
        ? {}
        : { attemptedStepId: redactDeployCliText(execution.result.attemptedStepId, env) }),
      ...(execution.result.code === undefined
        ? {}
        : { code: redactDeployCliText(execution.result.code, env) }),
      historyRecorded: execution.historyRecorded,
    },
    ...(execution.historyFailure === undefined
      ? {}
      : { failure: redactDeployCliFailure(execution.historyFailure, env) }),
  };
}
