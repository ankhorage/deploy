import type { DeploymentExecutionResult } from '../../domain/DeploymentExecutionResult';
import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';

export function mapDeploymentExecutionToReleaseMutation(
  execution: DeploymentExecutionResult,
): ReleaseMutationResult {
  if (execution.status === 'completed') return { status: 'completed' };
  if (execution.status === 'action-required') {
    return { status: 'blocked', code: execution.action.code };
  }
  if (execution.status === 'failed') {
    return { status: 'failed', code: execution.failure.code };
  }
  return { status: 'blocked', code: 'PROJECT_RELEASE_DEPLOYMENT_BLOCKED' };
}
