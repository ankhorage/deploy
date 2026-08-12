import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import { inspectDeploymentProviderSetup } from '../../engine/inspectDeploymentProviderSetup';
import type { AppStoreConnectIosState } from '../../providers/appStoreConnect/AppStoreConnectIosState';
import { createAppStoreConnectSetupAdapter } from '../../providers/appStoreConnect/createAppStoreConnectSetupAdapter';
import { inspectAppStoreConnectIos } from '../../providers/appStoreConnect/inspectAppStoreConnectIos';
import type { ProjectIosDeploymentRuntime } from './ProjectIosDeploymentRuntime';
import type { ResolvedProjectIosDeploymentAccess } from './resolveProjectIosDeploymentAccess';
import { scopeProjectIosDeploymentAccess } from './scopeProjectIosDeploymentAccess';

export interface ProjectIosAppStoreConnectInspection {
  readonly setup: DeploymentProviderSetupInspectionResult;
  readonly state: AppStoreConnectIosState | null;
}

export async function inspectProjectIosAppStoreConnect(options: {
  readonly bundleIdentifier: string;
  readonly version: string;
  readonly access: ResolvedProjectIosDeploymentAccess;
  readonly runtime: ProjectIosDeploymentRuntime;
}): Promise<ProjectIosAppStoreConnectInspection> {
  const access = scopeProjectIosDeploymentAccess(options.access, 'app-store-connect');
  const setup = await inspectDeploymentProviderSetup({
    adapter: createAppStoreConnectSetupAdapter({
      createToken: options.runtime.createAppStoreConnectToken,
      now: options.runtime.now,
    }),
    context: { target: 'ios', ...access },
  });
  if (!isReady(setup)) return { setup, state: null };
  const inspected = await inspectAppStoreConnectIos({
    bundleIdentifier: options.bundleIdentifier,
    version: options.version,
    ...access,
    createToken: options.runtime.createAppStoreConnectToken,
    request: options.runtime.requestAppStoreConnect,
    now: options.runtime.now(),
  });
  if (inspected.status === 'completed') return { setup, state: inspected.state };
  if (inspected.status === 'failed')
    return { setup: { ok: false, failure: inspected.failure }, state: null };
  return { setup: actionSetup(inspected.action), state: null };
}

function isReady(result: DeploymentProviderSetupInspectionResult): boolean {
  return (
    result.ok &&
    result.inspection.authentication.status === 'authenticated' &&
    result.inspection.provisioning.length === 0 &&
    result.inspection.capabilities.some(
      (capability) => capability.capability === 'publish' && capability.status === 'available',
    )
  );
}

function actionSetup(action: DeploymentRequiredAction): DeploymentProviderSetupInspectionResult {
  const authentication =
    action.type === 'authentication'
      ? { status: 'required' as const, action }
      : { status: 'authenticated' as const };
  const provisioning =
    action.type === 'authentication'
      ? [{ type: 'authentication' as const, action }]
      : [{ type: 'manual-action' as const, action }];
  return {
    ok: true,
    inspection: {
      provider: 'app-store-connect',
      authentication,
      capabilities: [
        { capability: 'publish', status: 'unavailable', reason: 'Provider setup is incomplete.' },
      ],
      provisioning,
    },
  };
}
