export type ReleaseMutationResult =
  | { readonly status: 'completed' }
  | { readonly status: 'blocked'; readonly code: string }
  | { readonly status: 'failed'; readonly code: string };
