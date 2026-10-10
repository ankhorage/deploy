import type { AnkhRuntimeCommandProvider } from '@ankhorage/ankh';
import type { Capability } from '@ankhorage/contracts/capability';

import packageJson from '../../package.json';
import { CAPABILITIES } from '../capabilities/index.js';
import type { DeployCliRuntime } from './DeployCliRuntime.js';
import { handleDeployCliCommand } from './handleDeployCliCommand.js';
import { handleDeployCliPlan } from './handleDeployCliPlan.js';

/*** Create the Deploy Ankh provider from the supplied package runtime. */
export function createDeployCliProvider(runtime: DeployCliRuntime): AnkhRuntimeCommandProvider {
  const command = {
    path: [],
    capability: 'deploy.execute' satisfies Capability['id'],
    summary: 'Inspect, plan and execute the authored project release',
    examples: [
      'ankh deploy',
      'ankh deploy --dry-run',
      'ankh deploy --yes --android-track production',
    ],
  } as const;

  return {
    id: packageJson.name,
    category: 'deploy',
    version: packageJson.version,
    capabilities: CAPABILITIES,
    commands: [command],
    handlers: [
      {
        path: [],
        handler: (request) =>
          handleDeployCliCommand({ argv: request.argv, context: request.context }, runtime),
      },
    ],
    planningHandlers: [
      {
        path: [],
        handler: (request) =>
          handleDeployCliPlan({ argv: request.argv, context: request.context }, runtime),
      },
    ],
  };
}
