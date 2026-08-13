import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function assertContainedWritePath(
  projectRoot: string,
  targetPath: string,
): Promise<void> {
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedTarget = path.resolve(targetPath);
  if (!isContained(resolvedRoot, resolvedTarget)) {
    throw new Error(`Deploy project path escapes project root: ${targetPath}`);
  }

  const realRoot = await fs.realpath(resolvedRoot);
  const existingParent = await findExistingParent(path.dirname(resolvedTarget));
  const realParent = await fs.realpath(existingParent);
  if (!isContained(realRoot, realParent)) {
    throw new Error(`Deploy project path resolves outside project root: ${targetPath}`);
  }
}

function isContained(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

async function findExistingParent(startPath: string): Promise<string> {
  let current = startPath;

  for (;;) {
    try {
      await fs.access(current);
      return current;
    } catch {
      const parent = path.dirname(current);
      if (parent === current) throw new Error(`No existing parent for path: ${startPath}`);
      current = parent;
    }
  }
}
