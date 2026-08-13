const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3';
const UPLOAD = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3';

export function googlePlayListingsUrl(packageName: string, editId: string): string {
  return `${base(API, packageName, editId)}/listings`;
}

export function googlePlayListingUrl(
  packageName: string,
  editId: string,
  locale: string,
): string {
  return `${googlePlayListingsUrl(packageName, editId)}/${segment(locale)}`;
}

export function googlePlayImagesUrl(
  packageName: string,
  editId: string,
  locale: string,
  imageType: string,
): string {
  return `${googlePlayListingUrl(packageName, editId, locale)}/${segment(imageType)}`;
}

export function googlePlayImageUploadUrl(
  packageName: string,
  editId: string,
  locale: string,
  imageType: string,
): string {
  return `${base(UPLOAD, packageName, editId)}/listings/${segment(locale)}/${segment(imageType)}`;
}

function base(host: string, packageName: string, editId: string): string {
  return `${host}/applications/${segment(packageName)}/edits/${segment(editId)}`;
}

function segment(value: string): string {
  return encodeURIComponent(value);
}
