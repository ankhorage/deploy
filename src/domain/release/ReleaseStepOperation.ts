export type ReleaseStepOperation =
  | 'prepare'
  | 'build'
  | 'publish'
  | 'sync-notes'
  | 'submit-review'
  | 'release'
  | 'rollout'
  | 'verify'
  | 'record';
