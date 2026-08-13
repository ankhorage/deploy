export interface ReleaseObservedWebState {
  readonly target: 'web';
  readonly version: string | null;
  readonly artifactRevision: string | null;
}
