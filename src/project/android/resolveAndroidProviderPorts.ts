import type { AppDeployManifest, AppDeployProviderSelection } from '@ankhorage/contracts/deploy';
import type {
  AndroidDeploymentBuilder,
  AndroidDeploymentPublisher,
  DeploymentProviderRegistration,
} from '@ankhorage/contracts/deploy-provider';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import { findDeploymentProvider } from '../../features/provider-registry/utils/findDeploymentProvider.js';
import type { ProjectAndroidDeploymentRuntime } from './ProjectAndroidDeploymentRuntime';

export interface AndroidProviderPorts {
  readonly providers: Required<Pick<AppDeployProviderSelection, 'build' | 'publish'>>;
  readonly buildRegistration: DeploymentProviderRegistration;
  readonly builder: AndroidDeploymentBuilder;
  readonly publishRegistration: DeploymentProviderRegistration;
  readonly publisher: AndroidDeploymentPublisher;
}

export type AndroidProviderPortsResult =
  | { readonly ok: true; readonly value: AndroidProviderPorts }
  | { readonly ok: false; readonly failure: DeploymentFailure };

/*** Resolve Android build and publish ports from authored provider ids. */
export function resolveAndroidProviderPorts(
  desired: AppDeployManifest,
  runtime: ProjectAndroidDeploymentRuntime,
): AndroidProviderPortsResult {
  const providers = desired.targets.android?.providers;
  const build = providers?.build;
  const publish = providers?.publish;
  if (build === undefined || publish === undefined) {
    return failure('ANDROID_PROVIDER_SELECTION_MISSING', 'Android provider selection is missing.');
  }
  const buildRegistration = findDeploymentProvider(runtime.providers, build, 'android-build', 'android');
  if (buildRegistration?.androidBuilder === undefined) {
    return failure(
      'ANDROID_BUILD_PROVIDER_UNAVAILABLE',
      'The configured Android build provider is not available.',
      build,
    );
  }
  const publishRegistration = findDeploymentProvider(
    runtime.providers,
    publish,
    'android-publish',
    'android',
  );
  if (publishRegistration?.androidPublisher === undefined) {
    return failure(
      'ANDROID_PUBLISH_PROVIDER_UNAVAILABLE',
      'The configured Android publish provider is not available.',
      publish,
    );
  }
  return {
    ok: true,
    value: {
      providers: { build, publish },
      buildRegistration,
      builder: buildRegistration.androidBuilder,
      publishRegistration,
      publisher: publishRegistration.androidPublisher,
    },
  };
}

function failure(code: string, message: string, provider?: string): AndroidProviderPortsResult {
  return {
    ok: false,
    failure: {
      code,
      message,
      target: 'android',
      ...(provider === undefined ? {} : { provider }),
    },
  };
}
