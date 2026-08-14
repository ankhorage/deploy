import type { ReleaseTarget } from './ReleaseTarget';

export interface ReleaseDiagnostic {
  readonly severity: 'warning' | 'error';
  readonly code: string;
  readonly message: string;
  readonly target?: ReleaseTarget | 'release';
}
