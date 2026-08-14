import { randomUUID } from 'node:crypto';

import {
  createProjectReleasePlan,
  executeProjectRelease,
  inspectProjectRelease,
} from '../project/index.js';
import type { DeployCliRuntime } from './DeployCliRuntime.js';

export const defaultDeployCliRuntime: DeployCliRuntime = {
  inspectProjectRelease,
  createProjectReleasePlan,
  executeProjectRelease,
  createExecutionId() {
    return `release-${randomUUID()}`;
  },
};
