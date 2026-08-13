import { promises as fs } from 'node:fs';

import type { ProjectStoreListingAsset } from '../../project/storeListing/ProjectStoreListingAsset';
import { googlePlayImagesUrl, googlePlayImageUploadUrl } from './googlePlayListingUrls';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { mapGooglePlayImageType } from './mapGooglePlayImageType';

export async function replaceGooglePlayImages(options: {
  readonly packageName: string;
  readonly editId: string;
  readonly locale: string;
  readonly variant: string;
  readonly assets: readonly ProjectStoreListingAsset[];
  readonly token: string;
  readonly request: GooglePlayTransport;
}): Promise<boolean> {
  const imageType = mapGooglePlayImageType(options.variant);
  if (imageType === null) return false;
  if (!(await deleteImages(options, imageType))) return false;
  for (const asset of options.assets) {
    if (!(await uploadImage(options, imageType, asset))) return false;
  }
  return true;
}

async function deleteImages(
  options: Parameters<typeof replaceGooglePlayImages>[0],
  imageType: string,
): Promise<boolean> {
  const response = await options.request({
    method: 'DELETE',
    url: googlePlayImagesUrl(options.packageName, options.editId, options.locale, imageType),
    token: options.token,
  });
  return response.status >= 200 && response.status < 300;
}

async function uploadImage(
  options: Parameters<typeof replaceGooglePlayImages>[0],
  imageType: string,
  asset: ProjectStoreListingAsset,
): Promise<boolean> {
  const bytes = await fs.readFile(asset.sourcePath);
  const response = await options.request({
    method: 'POST',
    url: googlePlayImageUploadUrl(options.packageName, options.editId, options.locale, imageType),
    token: options.token,
    contentType: asset.mediaType,
    body: new Blob([bytes]),
  });
  return response.status >= 200 && response.status < 300;
}
