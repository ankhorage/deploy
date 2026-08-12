import type { DeploymentProviderSetupAdapter } from '../domain/DeploymentProviderSetupAdapter';
import type { DeploymentProviderSetupContext } from '../domain/DeploymentProviderSetupContext';
import type { DeploymentProviderSetupInspectionResult } from '../domain/DeploymentProviderSetupInspectionResult';
import { createProviderSetupContext } from './providerSetup/createProviderSetupContext';
import { createProviderSetupFailure } from './providerSetup/createProviderSetupFailure';
import { createTrackedSecretResolver } from './providerSetup/createTrackedSecretResolver';
import { isAppDeployTargetId } from './providerSetup/isAppDeployTargetId';
import { isNonEmptyString } from './providerSetup/isNonEmptyString';
import { normalizeCredentialReferences } from './providerSetup/normalizeCredentialReferences';
import { normalizeProviderSetupInspection } from './providerSetup/normalizeProviderSetupInspection';

export async function inspectDeploymentProviderSetup(options: {
  readonly adapter: DeploymentProviderSetupAdapter;
  readonly context: DeploymentProviderSetupContext;
}): Promise<DeploymentProviderSetupInspectionResult> {
  const { provider } = options.adapter;
  const { target } = options.context;
  if (!isNonEmptyString(provider) || (target !== undefined && !isAppDeployTargetId(target))) {
    return createProviderSetupFailure(
      'INVALID_PROVIDER_SETUP_INPUT',
      'Provider setup input is invalid.',
    );
  }
  const credentials = normalizeCredentialReferences(options.context.credentials, provider);
  if (credentials === null || typeof options.context.resolveSecret !== 'function') {
    return createProviderSetupFailure(
      'INVALID_PROVIDER_SETUP_INPUT',
      'Provider setup input is invalid.',
      provider,
      target,
    );
  }

  const tracked = createTrackedSecretResolver(options.context.resolveSecret);
  const context = createProviderSetupContext(credentials, tracked.resolve, target);
  let rawInspection: unknown;
  try {
    rawInspection = await options.adapter.inspectSetup(context);
  } catch {
    return createProviderSetupFailure(
      'PROVIDER_SETUP_INSPECTION_FAILED',
      'Provider setup inspection failed.',
      provider,
      target,
    );
  }

  const normalized = normalizeProviderSetupInspection(rawInspection, provider, tracked.secrets);
  if (!normalized.ok) {
    const code = normalized.unsafe
      ? 'PROVIDER_SETUP_UNSAFE_RESULT'
      : 'PROVIDER_SETUP_INVALID_RESULT';
    return createProviderSetupFailure(
      code,
      'Provider setup inspection returned an invalid safe result.',
      provider,
      target,
    );
  }
  return { ok: true, inspection: normalized.inspection };
}
