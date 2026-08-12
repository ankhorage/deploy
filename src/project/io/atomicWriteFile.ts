import { promises as fs } from 'node:fs';
import path from 'node:path';

import { assertContainedWritePath } from './assertContainedPath';

let writeSequence = 0;

export async function atomicWriteFile(options: {
  readonly projectRoot: string;
  readonly filePath: string;
  readonly data: string | Uint8Array;
}): Promise<void> {
  await assertContainedWritePath(options.projectRoot, options.filePath);
  await fs.mkdir(path.dirname(options.filePath), { recursive: true });

  const tempPath = `${options.filePath}.tmp-${process.pid}-${writeSequence++}`;
  try {
    await fs.writeFile(tempPath, options.data, { flag: 'wx' });
    await fs.rename(tempPath, options.filePath);
  } catch (error) {
    await fs.rm(tempPath, { force: true });
    throw error;
  }
}
