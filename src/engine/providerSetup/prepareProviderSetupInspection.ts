import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

import type { DeploymentProviderSetupAdapter } from '../../domain/DeploymentProviderSetupAdapter';
import type { DeploymentProviderSetupContext } from '../../domain/DeploymentProviderSetupContext';
import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import { createProviderSetupContext } from './createProviderSetupContext';
import { createProviderSetupFailure } from './createProviderSetupFailure';
import { createTrackedSecretResolver } from './createTrackedSecretResolver';
import { isAppDeployTargetId } from './isAppDeployTargetId';
import { isNonEmptyString } from './isNonEmptyString';
import { normalizeCredentialReferences } from './normalizeCredentialReferences';

export type PreparedProviderSetupInspection =
  | {
      readonly ok: true;
      readonly provider: string;
      readonly target: AppDeployTargetId | undefined;
      readonly context: DeploymentProviderSetupContext;
      readonly secrets: ReadonlySet<string>;
    }
  | { readonly ok: false; readonly result: DeploymentProviderSetupInspectionResult };

export function prepareProviderSetupInspection(
  adapter: DeploymentProviderSetupAdapter,
  context: DeploymentProviderSetupContext,
): PreparedProviderSetupInspection {
  const { provider } = adapter;
  const { target } = context;
  if (!isNonEmptyString(provider) || (target !== undefined && !isAppDeployTargetId(target))) {
    return {
      ok: false,
      result: createProviderSetupFailure(
        'INVALID_PROVIDER_SETUP_INPUT',
        'Provider setup input is invalid.',
      ),
    };
  }
  const credentials = normalizeCredentialReferences(context.credentials, provider);
  if (credentials === null || typeof context.resolveSecret !== 'function') {
    return {
      ok: false,
      result: createProviderSetupFailure(
        'INVALID_PROVIDER_SETUP_INPUT',
        'Provider setup input is invalid.',
        provider,
        target,
      ),
    };
  }
  const tracked = createTrackedSecretResolver(context.resolveSecret);
  return {
    ok: true,
    provider,
    target,
    context: createProviderSetupContext(credentials, tracked.resolve, target),
    secrets: tracked.secrets,
  };
}
