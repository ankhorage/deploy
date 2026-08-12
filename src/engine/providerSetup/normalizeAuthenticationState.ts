import type { DeploymentAuthenticationState } from '../../domain/DeploymentAuthenticationState';
import { isRecord } from './isRecord';
import { normalizeAuthenticationAction } from './normalizeAuthenticationAction';

export function normalizeAuthenticationState(
  value: unknown,
  provider: string,
): DeploymentAuthenticationState | null {
  if (!isRecord(value)) return null;
  if (value.status === 'authenticated') return { status: 'authenticated' };
  if (value.status !== 'required') return null;

  const action = normalizeAuthenticationAction(value.action, provider);
  return action === null ? null : { status: 'required', action };
}
