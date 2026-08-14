import type { ReleaseObservedAndroidState } from './ReleaseObservedAndroidState';
import type { ReleaseObservedIosState } from './ReleaseObservedIosState';
import type { ReleaseObservedWebState } from './ReleaseObservedWebState';

export type ReleaseObservedTargetState =
  ReleaseObservedWebState | ReleaseObservedAndroidState | ReleaseObservedIosState;
