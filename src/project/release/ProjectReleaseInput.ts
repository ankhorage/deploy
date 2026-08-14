import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';

export type ProjectReleaseInput = Omit<ReleaseDesiredState, 'revision'>;
