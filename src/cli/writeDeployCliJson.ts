import type { DeployCliInput } from './DeployCliInput.js';
import type { DeployCliJsonEnvelope } from './DeployCliJsonEnvelope.js';

export function writeDeployCliJson(input: DeployCliInput, envelope: DeployCliJsonEnvelope): void {
  input.context.writeStdout(`${JSON.stringify(envelope)}\n`);
}
