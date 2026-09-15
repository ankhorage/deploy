import { describe, expect, test } from 'bun:test';

import { createWebReleaseObservation } from './createWebReleaseObservation.js';

describe('createWebReleaseObservation', () => {
  test('normalizes a published Web revision', () => {
    expect(createWebReleaseObservation('1.2.3', { revision: 'abc123' })).toEqual({
      target: 'web',
      version: '1.2.3',
      artifactRevision: 'abc123',
    });
  });

  test('normalizes a missing Web publication', () => {
    expect(createWebReleaseObservation('1.2.3', null)).toEqual({
      target: 'web',
      version: null,
      artifactRevision: null,
    });
  });
});
