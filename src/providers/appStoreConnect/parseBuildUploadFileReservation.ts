import type {
  BuildUploadFileReservation,
  BuildUploadOperation,
} from './BuildUploadOperation';

export function parseBuildUploadFileReservation(
  value: unknown,
  fileSize: number,
): BuildUploadFileReservation | null {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  const data = value.data;
  if (data.type !== 'buildUploadFiles' || !isNonEmptyString(data.id)) return null;
  if (!isRecord(data.attributes) || data.attributes.uti !== 'com.apple.ipa') return null;
  if (!Array.isArray(data.attributes.uploadOperations)) return null;
  const operations = data.attributes.uploadOperations.map(parseOperation);
  if (operations.some((operation) => operation === null)) return null;
  const valid = operations as BuildUploadOperation[];
  if (!rangesAreValid(valid, fileSize)) return null;
  return { fileId: data.id, operations: valid };
}

function parseOperation(value: unknown): BuildUploadOperation | null {
  if (!isRecord(value)) return null;
  if (!isSafeOffset(value.offset) || !isPositiveLength(value.length)) return null;
  if (!isNonEmptyString(value.method) || !isHttpsUrl(value.url)) return null;
  if (!Array.isArray(value.requestHeaders)) return null;
  const headers = value.requestHeaders.map(parseHeader);
  if (headers.some((header) => header === null)) return null;
  return {
    offset: value.offset,
    length: value.length,
    method: value.method,
    url: value.url,
    headers: headers as { readonly name: string; readonly value: string }[],
  };
}

function rangesAreValid(operations: readonly BuildUploadOperation[], fileSize: number): boolean {
  if (!Number.isSafeInteger(fileSize) || fileSize <= 0 || operations.length === 0) return false;
  const ranges = [...operations].sort((left, right) => left.offset - right.offset);
  let previousEnd = 0;
  for (const operation of ranges) {
    const end = operation.offset + operation.length;
    if (!Number.isSafeInteger(end) || end > fileSize || operation.offset < previousEnd) return false;
    previousEnd = end;
  }
  return true;
}

function parseHeader(value: unknown): { readonly name: string; readonly value: string } | null {
  if (!isRecord(value) || !isNonEmptyString(value.name) || typeof value.value !== 'string') {
    return null;
  }
  return { name: value.name, value: value.value };
}

function isSafeOffset(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveLength(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isHttpsUrl(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
