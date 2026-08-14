import type { AnkhRuntimeCommandProvider } from '@ankhorage/ankh';

import packageJson from '../../package.json';
import type { DeployCliRuntime } from './DeployCliRuntime.js';
import { handleDeployCliCommand } from './handleDeployCliCommand.js';
import { handleDeployCliPlan } from './handleDeployCliPlan.js';

export function createDeployCliProvider(runtime: DeployCliRuntime): AnkhRuntimeCommandProvider {
  const command = {
    path: [],
    capability: 'deploy.execute',
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
    capabilities: ['deploy.inspect', 'deploy.plan', 'deploy.execute'],
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
