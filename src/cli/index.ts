import { createDeployCliProvider } from './createDeployCliProvider.js';
import { defaultDeployCliRuntime } from './defaultDeployCliRuntime.js';

export { DEPLOY_CLI_ENVIRONMENT } from './DeployCliEnvironment.js';

const provider = createDeployCliProvider(defaultDeployCliRuntime);

export default provider;
