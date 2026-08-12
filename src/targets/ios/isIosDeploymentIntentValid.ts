import type { IosDeploymentIntent } from '../../domain/IosDeploymentIntent';

export function isIosDeploymentIntentValid(intent: IosDeploymentIntent): boolean {
  return intent.buildProfile.trim().length > 0 && intent.version.trim().length > 0;
}
