import { expect, test } from 'bun:test';

import { createReleasePlan } from './createReleasePlan';
import type { ReleaseDesiredState } from './ReleaseDesiredState';

test('provider-only release-note locales do not cause destructive drift', () => {
  const desired: ReleaseDesiredState = {
    version: '2.1.0',
    targets: ['android'],
    notes: [{ locale: 'en-US', text: 'New' }],
    rollout: { android: { mode: 'immediate' } },
    revision: 'desired',
  };
  const plan = createReleasePlan(desired, {
    targets: [
      {
        target: 'android',
        version: '2.1.0',
        artifactRevision: 'artifact',
        versionCodes: ['42'],
        releaseNotes: [
          { locale: 'de-CH', text: 'Provider-only note' },
          { locale: 'en-US', text: 'New' },
        ],
        rolloutStatus: 'completed',
      },
    ],
  });
  expect(plan.status).toBe('no-change');
  expect(plan.steps).toEqual([]);
});
