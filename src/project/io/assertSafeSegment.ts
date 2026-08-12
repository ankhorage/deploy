import path from 'node:path';

export function isSafeSegment(value: string): boolean {
  return (
    value.trim().length > 0 &&
    value !== '.' &&
    value !== '..' &&
    !path.isAbsolute(value) &&
    !value.includes('/') &&
    !value.includes('\\')
  );
}

export function assertSafeSegment(value: string, label: string): void {
  if (!isSafeSegment(value)) {
    throw new Error(`Invalid ${label}: expected one safe path segment.`);
  }
}
