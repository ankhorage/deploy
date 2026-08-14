export type ReleaseLifecycleControl =
  | { readonly target: 'android'; readonly action: 'halt' | 'resume' }
  | {
      readonly target: 'ios';
      readonly action: 'pause-phased' | 'resume-phased' | 'cancel-phased' | 'cancel-review';
    };
