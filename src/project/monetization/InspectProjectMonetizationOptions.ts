import type { ProjectMonetizationAccess } from './ProjectMonetizationAccess';

export interface InspectProjectMonetizationOptions extends ProjectMonetizationAccess {
  readonly projectRoot: string;
}
