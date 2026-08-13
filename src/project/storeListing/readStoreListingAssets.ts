import { createHash } from 'node:crypto';
import { type Dirent, promises as fs } from 'node:fs';
import path from 'node:path';

import { normalizeStoreListingLocale } from '../../domain/storeListing/normalizeStoreListingLocale';
import type { StoreListingAssetMediaType } from '../../domain/storeListing/StoreListingAsset';
import type { StoreListingTarget } from '../../domain/storeListing/StoreListingTarget';
import { isMissingPathError } from '../io/isMissingPathError';
import type { ProjectStoreListingAsset } from './ProjectStoreListingAsset';
import type { ProjectStoreListingAssetSet } from './ProjectStoreListingAssetSet';

export async function readStoreListingAssetSets(options: {
  readonly projectRoot: string;
  readonly androidRoot: string;
  readonly iosRoot: string;
  readonly locales: readonly string[];
}): Promise<readonly ProjectStoreListingAssetSet[]> {
  const android = await readAndroidAssetSets(options);
  const ios = await readScreenshotAssetSets(options.projectRoot, options.iosRoot, 'ios');
  return [...android, ...ios].sort(compareSets);
}

async function readAndroidAssetSets(
  options: Parameters<typeof readStoreListingAssetSets>[0],
): Promise<ProjectStoreListingAssetSet[]> {
  const shared = await readAndroidSharedSets(options);
  const screenshots = await readScreenshotAssetSets(
    options.projectRoot,
    path.join(options.androidRoot, 'screenshots'),
    'android',
  );
  return [...shared, ...screenshots];
}

async function readAndroidSharedSets(
  options: Parameters<typeof readStoreListingAssetSets>[0],
): Promise<ProjectStoreListingAssetSet[]> {
  const definitions = [
    { filename: 'icon.png', variant: 'icon' },
    { filename: 'feature.png', variant: 'feature' },
  ] as const;
  const result: ProjectStoreListingAssetSet[] = [];
  for (const definition of definitions) {
    const asset = await readOptionalAsset(
      options.projectRoot,
      options.androidRoot,
      definition.filename,
    );
    if (asset === null) continue;
    for (const locale of options.locales) {
      result.push({ target: 'android', locale, variant: definition.variant, assets: [asset] });
    }
  }
  return result;
}

async function readScreenshotAssetSets(
  projectRoot: string,
  root: string,
  target: StoreListingTarget,
): Promise<ProjectStoreListingAssetSet[]> {
  const result: ProjectStoreListingAssetSet[] = [];
  for (const localeDir of await readDirectories(root)) {
    const locale = normalizeStoreListingLocale(localeDir);
    const localeRoot = path.join(root, localeDir);
    for (const variant of await readDirectories(localeRoot)) {
      const assets = await readVariantAssets(projectRoot, path.join(localeRoot, variant));
      result.push({ target, locale, variant, assets });
    }
  }
  return result;
}

async function readVariantAssets(
  projectRoot: string,
  root: string,
): Promise<ProjectStoreListingAsset[]> {
  const files = await readImageFiles(root);
  return Promise.all(files.map((file) => createAsset(projectRoot, path.join(root, file))));
}

async function readOptionalAsset(
  projectRoot: string,
  root: string,
  filename: string,
): Promise<ProjectStoreListingAsset | null> {
  const sourcePath = path.join(root, filename);
  try {
    await fs.access(sourcePath);
  } catch (error) {
    if (isMissingPathError(error)) return null;
    throw error;
  }
  return createAsset(projectRoot, sourcePath);
}

async function createAsset(
  projectRoot: string,
  sourcePath: string,
): Promise<ProjectStoreListingAsset> {
  const bytes = await fs.readFile(sourcePath);
  return {
    sourcePath,
    relativePath: path.relative(projectRoot, sourcePath).split(path.sep).join('/'),
    sha256: createHash('sha256').update(bytes).digest('hex'),
    md5: createHash('md5').update(bytes).digest('hex'),
    size: bytes.byteLength,
    mediaType: mediaType(sourcePath),
  };
}

async function readDirectories(root: string): Promise<string[]> {
  const entries = await readEntries(root);
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function readImageFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  if (entries.some((entry) => entry.isFile() && !isImage(entry.name))) {
    throw new Error('STORE_LISTING_ASSET_TYPE_UNSUPPORTED');
  }
  return entries
    .filter(isImageFile)
    .map((entry) => entry.name)
    .sort();
}

async function readEntries(root: string): Promise<Dirent[]> {
  try {
    return await fs.readdir(root, { withFileTypes: true });
  } catch (error) {
    if (isMissingPathError(error)) return [];
    throw error;
  }
}

function isImageFile(entry: Dirent): boolean {
  return entry.isFile() && isImage(entry.name);
}

function isImage(filename: string): boolean {
  return /\.(png|jpe?g)$/i.test(filename);
}

function mediaType(filename: string): StoreListingAssetMediaType {
  return filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
}

function compareSets(a: ProjectStoreListingAssetSet, b: ProjectStoreListingAssetSet): number {
  return `${a.target}:${a.locale}:${a.variant}`.localeCompare(
    `${b.target}:${b.locale}:${b.variant}`,
  );
}
