export type ReleaseControlExecutionResult =
  | { readonly status: 'completed'; readonly writePerformed: boolean }
  | { readonly status: 'blocked'; readonly writePerformed: false; readonly code: string }
  | { readonly status: 'failed'; readonly writePerformed: boolean; readonly code: string };
