export type ReleaseControlExecutionResult =
  | { readonly status: 'completed'; readonly mutationAttempted: boolean }
  | { readonly status: 'blocked'; readonly mutationAttempted: false; readonly code: string }
  | { readonly status: 'failed'; readonly mutationAttempted: boolean; readonly code: string };
