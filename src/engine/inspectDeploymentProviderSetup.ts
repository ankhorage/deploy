import type { DeploymentProviderSetupAdapter } from '../domain/DeploymentProviderSetupAdapter';
import type { DeploymentProviderSetupContext } from '../domain/DeploymentProviderSetupContext';
import type { DeploymentProviderSetupInspectionResult } from '../domain/DeploymentProviderSetupInspectionResult';
import { createProviderSetupFailure } from './providerSetup/createProviderSetupFailure';
import { normalizeProviderSetupInspection } from './providerSetup/normalizeProviderSetupInspection';
import { prepareProviderSetupInspection } from './providerSetup/prepareProviderSetupInspection';

export async function inspectDeploymentProviderSetup(options: {
  readonly adapter: DeploymentProviderSetupAdapter;
  readonly context: DeploymentProviderSetupContext;
}): Promise<DeploymentProviderSetupInspectionResult> {
  const prepared = prepareProviderSetupInspection(options.adapter, options.context);
  if (!prepared.ok) return prepared.result;

  let rawInspection: unknown;
  try {
    rawInspection = await options.adapter.inspectSetup(prepared.context);
  } catch {
    return createProviderSetupFailure(
      'PROVIDER_SETUP_INSPECTION_FAILED',
      'Provider setup inspection failed.',
      prepared.provider,
      prepared.target,
    );
  }

  const normalized = normalizeProviderSetupInspection(
    rawInspection,
    prepared.provider,
    prepared.secrets,
  );
  if (normalized.ok) return { ok: true, inspection: normalized.inspection };

  const code = normalized.unsafe ? 'PROVIDER_SETUP_UNSAFE_RESULT' : 'PROVIDER_SETUP_INVALID_RESULT';
  return createProviderSetupFailure(
    code,
    'Provider setup inspection returned an invalid safe result.',
    prepared.provider,
    prepared.target,
  );
}
