import path from 'node:path';

import type { ProjectDeploymentPaths } from './ProjectDeploymentPaths';

export function resolveProjectDeploymentPaths(projectRoot: string): ProjectDeploymentPaths {
  const root = path.resolve(projectRoot);
  const authoredRoot = path.join(root, 'deploy');
  const assetsRoot = path.join(authoredRoot, 'assets');
  const androidAssetsRoot = path.join(assetsRoot, 'android');
  const iosAssetsRoot = path.join(assetsRoot, 'ios');

  return {
    projectRoot: root,
    manifestPath: path.join(root, 'ankh.config.json'),
    authoredRoot,
    listingRoot: path.join(authoredRoot, 'listing'),
    assetsRoot,
    sharedAssetsRoot: path.join(assetsRoot, 'shared'),
    androidAssetsRoot,
    androidScreenshotsRoot: path.join(androidAssetsRoot, 'screenshots'),
    iosAssetsRoot,
    iosScreenshotsRoot: path.join(iosAssetsRoot, 'screenshots'),
    monetizationRoot: path.join(authoredRoot, 'monetization'),
    productsPath: path.join(authoredRoot, 'monetization', 'products.json'),
    releasePath: path.join(authoredRoot, 'release.json'),
    historyRoot: path.join(root, '.ankh', 'deployments'),
  };
}
