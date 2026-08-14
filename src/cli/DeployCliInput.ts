import type { AnkhCommandContext } from '@ankhorage/ankh';

export interface DeployCliInput {
  readonly argv: readonly string[];
  readonly context: AnkhCommandContext;
}
