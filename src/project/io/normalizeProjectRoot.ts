import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function normalizeProjectRoot(projectRoot: string): Promise<string> {
  const requestedRoot = path.resolve(projectRoot);
  let resolvedRoot: string;

  try {
    resolvedRoot = await fs.realpath(requestedRoot);
  } catch (error) {
    throw new Error(`Deploy project root does not exist: ${requestedRoot}`, { cause: error });
  }

  const stat = await fs.stat(resolvedRoot);
  if (!stat.isDirectory()) {
    throw new Error(`Deploy project root is not a directory: ${resolvedRoot}`);
  }

  return resolvedRoot;
}
