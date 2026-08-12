import { promises as fs } from 'node:fs';
import path from 'node:path';

import { type AppManifest, parseAppManifest } from '@ankhorage/contracts';

import { readJsonFile } from './readJsonFile';

export async function readProjectManifest(projectRoot: string): Promise<{
  readonly manifest: AppManifest;
  readonly manifestPath: string;
}> {
  const manifestPath = path.join(projectRoot, 'ankh.config.json');

  try {
    await fs.access(manifestPath);
  } catch (error) {
    throw new Error(`Deploy project manifest does not exist: ${manifestPath}`, { cause: error });
  }

  const parsed = await readJsonFile(manifestPath, 'Deploy project manifest');
  const result = parseAppManifest(parsed);
  if (!result.ok) {
    throw new Error(`Deploy project manifest has an invalid canonical shape: ${manifestPath}`);
  }

  return { manifest: result.manifest, manifestPath };
}
