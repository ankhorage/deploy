import type { AppDeployManifest, AppDeployProviderSelection } from '@ankhorage/contracts/deploy';
import type {
  DeploymentProviderRegistration,
  IosDeploymentBuilder,
  IosDeploymentPublisher,
} from '@ankhorage/contracts/deploy-provider';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import { findDeploymentProvider } from '../../features/provider-registry/utils/findDeploymentProvider.js';
import type { ProjectIosDeploymentRuntime } from './ProjectIosDeploymentRuntime';

export interface IosProviderPorts {
  readonly providers: Required<Pick<AppDeployProviderSelection, 'build' | 'publish'>>;
  readonly buildRegistration: DeploymentProviderRegistration;
  readonly builder: IosDeploymentBuilder;
  readonly publishRegistration: DeploymentProviderRegistration;
  readonly publisher: IosDeploymentPublisher;
}

export type IosProviderPortsResult =
  | { readonly ok: true; readonly value: IosProviderPorts }
  | { readonly ok: false; readonly failure: DeploymentFailure };

/*** Resolve iOS build and publish ports from authored provider ids. */
export function resolveIosProviderPorts(
  desired: AppDeployManifest,
  runtime: ProjectIosDeploymentRuntime,
): IosProviderPortsResult {
  const providers = desired.targets.ios?.providers;
  const build = providers?.build;
  const publish = providers?.publish;
  if (build === undefined || publish === undefined) {
    return failure('IOS_PROVIDER_SELECTION_MISSING', 'iOS provider selection is missing.');
  }
  const buildRegistration = findDeploymentProvider(runtime.providers, build, 'ios-build', 'ios');
  if (buildRegistration?.iosBuilder === undefined) {
    return failure(
      'IOS_BUILD_PROVIDER_UNAVAILABLE',
      'The configured iOS build provider is not available.',
      build,
    );
  }
  const publishRegistration = findDeploymentProvider(runtime.providers, publish, 'ios-publish', 'ios');
  if (publishRegistration?.iosPublisher === undefined) {
    return failure(
      'IOS_PUBLISH_PROVIDER_UNAVAILABLE',
      'The configured iOS publish provider is not available.',
      publish,
    );
  }
  return {
    ok: true,
    value: {
      providers: { build, publish },
      buildRegistration,
      builder: buildRegistration.iosBuilder,
      publishRegistration,
      publisher: publishRegistration.iosPublisher,
    },
  };
}

function failure(code: string, message: string, provider?: string): IosProviderPortsResult {
  return {
    ok: false,
    failure: {
      code,
      message,
      target: 'ios',
      ...(provider === undefined ? {} : { provider }),
    },
  };
}
