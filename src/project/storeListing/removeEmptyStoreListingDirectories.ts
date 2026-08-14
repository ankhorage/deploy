import { promises as fs } from 'node:fs';

import { assertContainedWritePath } from '../io/assertContainedPath';
import { isMissingPathError } from '../io/isMissingPathError';

export async function removeEmptyStoreListingDirectories(
  projectRoot: string,
  directories: readonly string[],
): Promise<void> {
  for (const directory of directories) {
    if (!(await isEmpty(directory))) continue;
    await assertContainedWritePath(projectRoot, directory);
    await removeEmptyDirectory(directory);
  }
}

async function isEmpty(directory: string): Promise<boolean> {
  try {
    return (await fs.readdir(directory)).length === 0;
  } catch (error) {
    if (isMissingPathError(error)) return false;
    throw error;
  }
}

async function removeEmptyDirectory(directory: string): Promise<void> {
  try {
    await fs.rmdir(directory);
  } catch (error) {
    if (isMissingPathError(error)) return;
    throw error;
  }
}
