/** First-class `ankh deploy` provider and stable CI automation contract. */
import { createDeployCliProvider } from './createDeployCliProvider.js';
import { defaultDeployCliRuntime } from './defaultDeployCliRuntime.js';

export { DEPLOY_CLI_ENVIRONMENT } from './DeployCliEnvironment.js';
export type { DeployCliExitCode } from './DeployCliExitCode.js';
export { DEPLOY_CLI_EXIT_CODES } from './DeployCliExitCodes.js';
export type { DeployCliJsonEnvelope } from './DeployCliJsonEnvelope.js';

const provider = createDeployCliProvider(defaultDeployCliRuntime);

export default provider;
