import type { DeploymentProviderSetupAdapter } from '../../domain/DeploymentProviderSetupAdapter';
import type { DeploymentProviderSetupContext } from '../../domain/DeploymentProviderSetupContext';
import type { DeploymentProviderSetupInspection } from '../../domain/DeploymentProviderSetupInspection';
import type { DeploymentAuthenticationRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { DeploymentProcessRunner } from '../../runtime/process/DeploymentProcessRunner';
import { resolveEasProcessEnvironment } from './resolveEasProcessEnvironment';

export function createEasHostingSetupAdapter(options: {
  readonly projectRoot: string;
  readonly runProcess: DeploymentProcessRunner;
}): DeploymentProviderSetupAdapter {
  return {
    provider: 'eas',
    inspectSetup: (context) => inspectEasHostingSetup(options, context),
  };
}

async function inspectEasHostingSetup(
  options: { readonly projectRoot: string; readonly runProcess: DeploymentProcessRunner },
  context: DeploymentProviderSetupContext,
): Promise<DeploymentProviderSetupInspection> {
  const environment = await resolveEasProcessEnvironment(context);
  if (!environment.ok) return authenticationRequired(environment.action);

  const account = await options.runProcess({
    command: 'eas',
    args: ['account:view'],
    cwd: options.projectRoot,
    ...(environment.env === undefined ? {} : { env: environment.env }),
  });
  if (account.exitCode !== 0) return authenticationRequired(createAuthenticationAction());

  const project = await options.runProcess({
    command: 'eas',
    args: ['project:info'],
    cwd: options.projectRoot,
    ...(environment.env === undefined ? {} : { env: environment.env }),
  });
  return project.exitCode === 0 ? readyInspection() : projectLinkRequired();
}

function createAuthenticationAction(): DeploymentAuthenticationRequiredAction {
  return {
    type: 'authentication',
    provider: 'eas',
    target: 'web',
    code: 'EAS_AUTHENTICATION_REQUIRED',
    message: 'EAS authentication is required for Web deployment.',
  };
}

function authenticationRequired(
  action: DeploymentAuthenticationRequiredAction,
): DeploymentProviderSetupInspection {
  return {
    provider: 'eas',
    authentication: { status: 'required', action },
    capabilities: [
      { capability: 'publish', status: 'unavailable', reason: 'Authentication required.' },
    ],
    provisioning: [{ type: 'authentication', action }],
  };
}

function readyInspection(): DeploymentProviderSetupInspection {
  return {
    provider: 'eas',
    authentication: { status: 'authenticated' },
    capabilities: [{ capability: 'publish', status: 'available' }],
    provisioning: [],
  };
}

function projectLinkRequired(): DeploymentProviderSetupInspection {
  return {
    provider: 'eas',
    authentication: { status: 'authenticated' },
    capabilities: [
      { capability: 'publish', status: 'unavailable', reason: 'EAS project link required.' },
    ],
    provisioning: [
      {
        type: 'manual-action',
        action: {
          type: 'manual-action',
          target: 'web',
          provider: 'eas',
          code: 'EAS_PROJECT_LINK_REQUIRED',
          message: 'Link the Expo project to an EAS project before publishing.',
        },
      },
    ],
  };
}
