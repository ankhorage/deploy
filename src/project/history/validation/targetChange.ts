import {
  DEPLOYMENT_CHANGE_KINDS,
  DEPLOYMENT_CHANGE_REASONS,
} from '../../../domain/DeploymentTargetChange';
import { hasOnlyKeys } from '../../io/hasOnlyKeys';
import { isRecord } from '../../io/isRecord';
import { isObservedTarget } from './observedTarget';
import { isTargetId } from './shared';

const CHANGE_KEYS = new Set(['target', 'kind', 'desired', 'current', 'reason']);

export function isTargetChange(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, CHANGE_KEYS) &&
    isTargetId(value.target) &&
    DEPLOYMENT_CHANGE_KINDS.some((kind) => kind === value.kind) &&
    isNullableObservedTarget(value.desired) &&
    isNullableObservedTarget(value.current) &&
    DEPLOYMENT_CHANGE_REASONS.some((reason) => reason === value.reason)
  );
}

function isNullableObservedTarget(value: unknown): boolean {
  return value === null || isObservedTarget(value);
}
