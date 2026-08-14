import type { ProjectReleaseExecution } from '../project/index.js';

export function renderDeployCliExecution(
  execution: ProjectReleaseExecution,
  executionId: string,
  format: 'human' | 'json',
): string {
  if (format === 'json') {
    return `${JSON.stringify({ kind: 'deploy-release-execution', executionId, execution })}\n`;
  }
  const lines = [
    `Execution: ${executionId}`,
    `Result: ${execution.result.status}`,
    `Current revision: ${execution.result.currentRevision}`,
    `History recorded: ${execution.historyRecorded ? 'yes' : 'no'}`,
  ];
  if (execution.result.code !== undefined) lines.push(`Code: ${execution.result.code}`);
  if (execution.result.executedStepIds.length > 0) {
    lines.push(`Executed steps: ${execution.result.executedStepIds.join(', ')}`);
  }
  if (execution.historyFailure !== undefined) {
    lines.push(
      `History failure: ${execution.historyFailure.code}: ${execution.historyFailure.message}`,
    );
  }
  lines.push('');
  return lines.join('\n');
}
