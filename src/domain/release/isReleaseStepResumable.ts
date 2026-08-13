import type { ReleaseExecutionStep } from './ReleaseExecutionStep';

export function isReleaseStepResumable(step: ReleaseExecutionStep): boolean {
  if (step.status === 'completed' || step.status === 'cancelled') return false;
  return step.step.retry !== 'never';
}
