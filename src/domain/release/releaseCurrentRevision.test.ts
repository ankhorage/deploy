import { expect, test } from 'bun:test';

import { createReleaseCurrentRevision } from './createReleaseCurrentRevision';
import type { ReleaseObservedState } from './ReleaseObservedState';

test('release current revision is deterministic and ignores unselected targets', () => {
  const first: ReleaseObservedState = {
    targets: [
      {
        target: 'ios',
        version: '2.1.0',
        artifactRevision: 'ios-artifact',
        buildNumber: '42',
        releaseNotes: [{ locale: 'de-CH', text: 'Neu' }],
        appVersionState: 'PENDING_DEVELOPER_RELEASE',
        releaseType: 'MANUAL',
        reviewState: 'COMPLETE',
        phasedReleaseState: 'INACTIVE',
      },
      {
        target: 'android',
        version: '2.1.0',
        artifactRevision: 'android-artifact',
        versionCodes: ['42'],
        releaseNotes: [{ locale: 'de-CH', text: 'Neu' }],
        rolloutStatus: 'inProgress',
        userFraction: '0.1000',
      },
    ],
  };
  const android = first.targets.find((target) => target.target === 'android');
  const ios = first.targets.find((target) => target.target === 'ios');
  if (android?.target !== 'android' || ios?.target !== 'ios') {
    throw new Error('Expected mobile release fixtures.');
  }
  const second: ReleaseObservedState = {
    targets: [
      { ...android, userFraction: '0.1' },
      ios,
      { target: 'web', version: '9.9.9', artifactRevision: 'ignored' },
    ],
  };
  expect(createReleaseCurrentRevision(first, ['android', 'ios'])).toBe(
    createReleaseCurrentRevision(second, ['ios', 'android']),
  );
});
