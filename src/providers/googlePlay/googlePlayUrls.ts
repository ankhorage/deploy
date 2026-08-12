import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';

const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3';
const UPLOAD = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3';

export function googlePlayInsertEditUrl(packageName: string): string {
  return `${API}/applications/${segment(packageName)}/edits`;
}

export function googlePlayBundleUploadUrl(packageName: string, editId: string): string {
  return `${UPLOAD}/applications/${segment(packageName)}/edits/${segment(editId)}/bundles`;
}

export function googlePlayTrackEditUrl(
  packageName: string,
  editId: string,
  track: AndroidDeploymentTrack,
): string {
  return `${API}/applications/${segment(packageName)}/edits/${segment(editId)}/tracks/${segment(track)}`;
}

export function googlePlayCommitEditUrl(packageName: string, editId: string): string {
  return `${API}/applications/${segment(packageName)}/edits/${segment(editId)}:commit`;
}

function segment(value: string): string {
  return encodeURIComponent(value);
}
