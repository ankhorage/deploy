import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import { inspectDeploymentProviderSetup } from '../../engine/inspectDeploymentProviderSetup';
import { createGooglePlaySetupAdapter } from '../../providers/googlePlay/createGooglePlaySetupAdapter';
import type { GooglePlayTrackState } from '../../providers/googlePlay/GooglePlayTrackState';
import { inspectGooglePlayTrack } from '../../providers/googlePlay/inspectGooglePlayTrack';
import type { ProjectAndroidDeploymentRuntime } from './ProjectAndroidDeploymentRuntime';
import type { ResolvedProjectAndroidDeploymentAccess } from './resolveProjectAndroidDeploymentAccess';
import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';

export interface ProjectAndroidGooglePlayInspection {
  readonly setup: DeploymentProviderSetupInspectionResult;
  readonly trackState: GooglePlayTrackState | null;
}

export async function inspectProjectAndroidGooglePlay(options: {
  readonly packageName: string;
  readonly track: AndroidDeploymentTrack;
  readonly access: ResolvedProjectAndroidDeploymentAccess;
  readonly runtime: ProjectAndroidDeploymentRuntime;
}): Promise<ProjectAndroidGooglePlayInspection> {
  const setup = await inspectDeploymentProviderSetup({
    adapter: createGooglePlaySetupAdapter({ createToken: options.runtime.createGooglePlayToken }),
    context: { target: 'android', ...options.access },
  });
  if (!isReady(setup)) return { setup, trackState: null };
  const inspected = await inspectGooglePlayTrack({
    packageName: options.packageName,
    track: options.track,
    ...options.access,
    createToken: options.runtime.createGooglePlayToken,
    request: options.runtime.requestGooglePlay,
  });
  if (inspected.status === 'completed') return { setup, trackState: inspected.state };
  if (inspected.status === 'failed') {
    return { setup: { ok: false, failure: inspected.failure }, trackState: null };
  }
  return { setup: actionSetup(inspected.action), trackState: null };
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
      provider: 'google-play',
      authentication,
      capabilities: [
        { capability: 'publish', status: 'unavailable', reason: 'Provider setup is incomplete.' },
      ],
      provisioning,
    },
  };
}
