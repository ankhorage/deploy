import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

import type { DeploymentCapability } from '../../domain/DeploymentCapability';
import type { DeploymentProviderSetupAdapter } from '../../domain/DeploymentProviderSetupAdapter';
import type { DeploymentProviderSetupContext } from '../../domain/DeploymentProviderSetupContext';
import type { DeploymentProviderSetupInspection } from '../../domain/DeploymentProviderSetupInspection';
import type { DeploymentAuthenticationRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { DeploymentProcessRunner } from '../../runtime/process/DeploymentProcessRunner';
import { resolveEasProcessEnvironment } from './resolveEasProcessEnvironment';

interface EasSetupOptions {
  readonly projectRoot: string;
  readonly runProcess: DeploymentProcessRunner;
  readonly target: AppDeployTargetId;
  readonly capability: DeploymentCapability;
}

export function createEasSetupAdapter(options: EasSetupOptions): DeploymentProviderSetupAdapter {
  return {
    provider: 'eas',
    inspectSetup: (context) => inspectEasSetup(options, context),
  };
}

async function inspectEasSetup(
  options: EasSetupOptions,
  context: DeploymentProviderSetupContext,
): Promise<DeploymentProviderSetupInspection> {
  const environment = await resolveEasProcessEnvironment({ ...context, target: options.target });
  if (!environment.ok) return authenticationRequired(options, environment.action);
  const processOptions = environment.env === undefined ? {} : { env: environment.env };
  const account = await options.runProcess({
    command: 'eas',
    args: ['account:view'],
    cwd: options.projectRoot,
    ...processOptions,
  });
  if (account.exitCode !== 0) return authenticationRequired(options, authenticationAction(options));
  const project = await options.runProcess({
    command: 'eas',
    args: ['project:info'],
    cwd: options.projectRoot,
    ...processOptions,
  });
  return project.exitCode === 0 ? ready(options) : projectLinkRequired(options);
}

function authenticationAction(options: EasSetupOptions): DeploymentAuthenticationRequiredAction {
  return {
    type: 'authentication',
    provider: 'eas',
    target: options.target,
    code: 'EAS_AUTHENTICATION_REQUIRED',
    message: `EAS authentication is required for ${options.target} deployment.`,
  };
}

function authenticationRequired(
  options: EasSetupOptions,
  action: DeploymentAuthenticationRequiredAction,
): DeploymentProviderSetupInspection {
  return {
    provider: 'eas',
    authentication: { status: 'required', action },
    capabilities: [unavailable(options, 'Authentication required.')],
    provisioning: [{ type: 'authentication', action }],
  };
}

function ready(options: EasSetupOptions): DeploymentProviderSetupInspection {
  return {
    provider: 'eas',
    authentication: { status: 'authenticated' },
    capabilities: [{ capability: options.capability, status: 'available' }],
    provisioning: [],
  };
}

function projectLinkRequired(options: EasSetupOptions): DeploymentProviderSetupInspection {
  const action = {
    type: 'manual-action' as const,
    target: options.target,
    provider: 'eas',
    code: 'EAS_PROJECT_LINK_REQUIRED',
    message: 'Link the Expo project to an EAS project before deployment.',
  };
  return {
    provider: 'eas',
    authentication: { status: 'authenticated' },
    capabilities: [unavailable(options, 'EAS project link required.')],
    provisioning: [{ type: 'manual-action', action }],
  };
}

function unavailable(options: EasSetupOptions, reason: string) {
  return { capability: options.capability, status: 'unavailable' as const, reason };
}
