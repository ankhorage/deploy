import type { ProjectDeploymentHistoryRecord } from './history/ProjectDeploymentHistoryRecord';

export function createHistoryRecord(
  deploymentId: string,
): ProjectDeploymentHistoryRecord {
  return {
    schemaVersion: 1,
    deploymentId,
    recordedAt: '2026-08-12T12:00:00.000Z',
    desired: null,
    plan: {
      changes: [
        {
          target: 'web',
          kind: 'none',
          desired: null,
          current: null,
          reason: 'already-absent',
        },
      ],
      steps: [],
      diagnostics: [],
      executable: true,
    },
    execution: { status: 'completed', records: [] },
    verification: { ok: true },
  };
}
