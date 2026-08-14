import { promises as fs } from 'node:fs';

import { assertContainedWritePath } from './assertContainedPath';

export async function removeContainedPath(options: {
  readonly projectRoot: string;
  readonly targetPath: string;
  readonly recursive?: boolean;
}): Promise<void> {
  await assertContainedWritePath(options.projectRoot, options.targetPath);
  await fs.rm(options.targetPath, {
    force: true,
    recursive: options.recursive ?? false,
  });
}
