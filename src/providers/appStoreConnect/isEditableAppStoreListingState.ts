const EDITABLE_STATES = new Set([
  'PREPARE_FOR_SUBMISSION',
  'READY_FOR_REVIEW',
  'INVALID_BINARY',
  'REJECTED',
  'METADATA_REJECTED',
  'DEVELOPER_REJECTED',
]);

export function isEditableAppStoreListingState(value: unknown): boolean {
  return typeof value === 'string' && EDITABLE_STATES.has(value);
}
