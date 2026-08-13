import { createHash } from 'node:crypto';
import { promises as fs, type Dirent } from 'node:fs';
import path from 'node:path';

import type {
  StoreListingAsset,
  StoreListingTarget,
} from '../../domain/storeListing/StoreListingAsset';
import { normalizeStoreListingLocale } from '../../domain/storeListing/normalizeStoreListingLocale';
import { assertSafeSegment } from '../io/assertSafeSegment';
import type { ProjectDeploymentPaths } from '../ProjectDeploymentPaths';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

export async function discoverStoreListingAssets(
  paths: ProjectDeploymentPaths,
): Promise<readonly StoreListingAsset[]> {
  const assets = [
    ...(await discoverAndroidTopLevel(paths)),
    ...(await discoverScreenshots('android', paths.androidScreenshotsRoot, paths.projectRoot)),
    ...(await discoverScreenshots('ios', paths.iosScreenshotsRoot, paths.projectRoot)),
  ];
  return assets.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function discoverAndroidTopLevel(paths: ProjectDeploymentPaths): Promise<StoreListingAsset[]> {
  const candidates = [
    ['icon', path.join(paths.androidAssetsRoot, 'icon.png')],
    ['feature', path.join(paths.androidAssetsRoot, 'feature.png')],
  ] as const;
  const results: StoreListingAsset[] = [];
  for (const [kind, filePath] of candidates) {
    if (await fileExists(filePath)) {
      results.push(await createAsset('android', kind, null, null, filePath, paths.projectRoot));
    }
  }
  return results;
}

async function discoverScreenshots(
  target: StoreListingTarget,
  root: string,
  projectRoot: string,
): Promise<StoreListingAsset[]> {
  if (!(await directoryExists(root))) return [];
  const results: StoreListingAsset[] = [];
  for (const localeEntry of await sortedDirectories(root)) {
    const locale = normalizeStoreListingLocale(localeEntry.name);
    if (locale === null) throw new Error(`Invalid screenshot locale: ${localeEntry.name}`);
    await addLocaleScreenshots(results, target, locale, localeEntry.name, root, projectRoot);
  }
  return results;
}

async function addLocaleScreenshots(
  results: StoreListingAsset[],
  target: StoreListingTarget,
  locale: string,
  authoredLocale: string,
  root: string,
  projectRoot: string,
): Promise<void> {
  for (const variantEntry of await sortedDirectories(path.join(root, authoredLocale))) {
    assertSafeSegment(variantEntry.name, 'screenshot variant');
    const variantRoot = path.join(root, authoredLocale, variantEntry.name);
    for (const file of await sortedImageFiles(variantRoot)) {
      results.push(
        await createAsset(
          target,
          'screenshot',
          locale,
          variantEntry.name,
          path.join(variantRoot, file.name),
          projectRoot,
        ),
      );
    }
  }
}

async function createAsset(
  target: StoreListingTarget,
  kind: StoreListingAsset['kind'],
  locale: string | null,
  variant: string | null,
  filePath: string,
  projectRoot: string,
): Promise<StoreListingAsset> {
  const bytes = await fs.readFile(filePath);
  const relativePath = path.relative(projectRoot, filePath).split(path.sep).join('/');
  if (relativePath.startsWith('../') || path.isAbsolute(relativePath)) {
    throw new Error('Store listing asset escapes project root.');
  }
  return {
    target,
    kind,
    locale,
    variant,
    relativePath,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    md5: createHash('md5').update(bytes).digest('hex'),
    size: bytes.length,
  };
}

async function sortedDirectories(root: string): Promise<Dirent[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
}

async function sortedImageFiles(root: string): Promise<Dirent[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    return (await fs.stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function directoryExists(filePath: string): Promise<boolean> {
  try {
    return (await fs.stat(filePath)).isDirectory();
  } catch {
    return false;
  }
}
