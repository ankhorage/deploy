import type { ReleasePlan } from '../index.js';
import type {
  ExecuteProjectReleaseOptions,
  InspectProjectReleaseOptions,
  ProjectReleaseExecutionResult,
  ProjectReleaseInspection,
  ProjectReleaseInspectionResult,
} from '../project/index.js';

export interface DeployCliRuntime {
  inspectProjectRelease(
    options: InspectProjectReleaseOptions,
  ): Promise<ProjectReleaseInspectionResult>;
  createProjectReleasePlan(inspection: ProjectReleaseInspection): ReleasePlan;
  executeProjectRelease(
    options: ExecuteProjectReleaseOptions,
  ): Promise<ProjectReleaseExecutionResult>;
  createExecutionId(): string;
}
