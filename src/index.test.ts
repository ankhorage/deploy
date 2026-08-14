import { expect, test } from 'bun:test';

import * as deploy from './index.js';

test('package entrypoint exposes the canonical deployment domain', () => {
  expect(Object.keys(deploy).sort()).toEqual([
    'DEPLOYMENT_CAPABILITIES',
    'DEPLOYMENT_CHANGE_KINDS',
    'DEPLOYMENT_CHANGE_REASONS',
    'DEPLOYMENT_PLAN_DIAGNOSTIC_CODES',
    'DEPLOYMENT_STEP_OPERATIONS',
    'createDeploymentChanges',
    'createDeploymentPlan',
    'createReleaseCurrentRevision',
    'createReleaseExecutionState',
    'createReleasePlan',
    'createReleaseRevision',
    'executeDeploymentPlan',
    'executeReleaseLifecycleControl',
    'executeReleasePlan',
    'inspectDeploymentProviderSetup',
    'isReleaseStepResumable',
    'listReleaseLifecycleControls',
    'resumeReleaseExecution',
  ]);
});
