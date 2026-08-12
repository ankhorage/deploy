import { hasOnlyKeys } from '../../io/hasOnlyKeys';
import { isRecord } from '../../io/isRecord';
import { isDeploymentFailure } from './failure';
import { isRequiredAction } from './requiredAction';

export function isStepOutcome(value: unknown): boolean {
  if (!isRecord(value)) return false;

  switch (value.status) {
    case 'completed':
      return hasOnlyKeys(value, new Set(['status']));
    case 'skipped':
      return hasOnlyKeys(value, new Set(['status', 'reason'])) && typeof value.reason === 'string';
    case 'action-required':
      return hasOnlyKeys(value, new Set(['status', 'action'])) && isRequiredAction(value.action);
    case 'failed':
      return hasOnlyKeys(value, new Set(['status', 'error'])) && isDeploymentFailure(value.error);
    default:
      return false;
  }
}
