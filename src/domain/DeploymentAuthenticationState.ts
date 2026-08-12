import type { DeploymentAuthenticationRequiredAction } from './DeploymentRequiredAction';

export type DeploymentAuthenticationState =
  | { readonly status: 'authenticated' }
  | {
      readonly status: 'required';
      readonly action: DeploymentAuthenticationRequiredAction;
    };
