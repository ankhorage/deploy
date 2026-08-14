import type { DeployCliInput } from './DeployCliInput.js';
import { redactDeployCliText } from './redactDeployCliText.js';

export function writeDeployCliHuman(
  input: DeployCliInput,
  stream: 'stdout' | 'stderr',
  text: string,
): void {
  const safe = redactDeployCliText(text, input.context.env);
  if (stream === 'stdout') input.context.writeStdout(safe);
  else input.context.writeStderr(safe);
}
