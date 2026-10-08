# Public API

## AndroidDeploymentIntent

Kind: `type`
Module: `src/domain/AndroidDeploymentIntent.ts`
Source: `src/domain/AndroidDeploymentIntent.ts:7:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| buildProfile | property | `string` | yes |  |
| releaseStatus | property | `"draft" \| "completed"` | yes |  |
| track | property | `"internal" \| "alpha" \| "beta" \| "production"` | yes |  |

## AndroidDeploymentPublication

Kind: `type`
Module: `node_modules/@ankhorage/contracts/dist/types/deployProvider.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/types/deployProvider.d.ts:180:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| buildId | property | `string` | yes |  |
| buildProvider | property | `string` | yes |  |
| publishProvider | property | `string` | yes |  |
| releaseStatus | property | `"draft" \| "completed"` | yes |  |
| revision | property | `string` | yes |  |
| target | property | `"android"` | yes |  |
| track | property | `"internal" \| "alpha" \| "beta" \| "production"` | yes |  |
| versionCode | property | `number` | yes |  |

## AndroidDeploymentTrack

Kind: `unknown`
Module: `src/domain/AndroidDeploymentIntent.ts`
Source: `src/domain/AndroidDeploymentIntent.ts:2:1`

## AndroidReleaseStatus

Kind: `unknown`
Module: `src/domain/AndroidDeploymentIntent.ts`
Source: `src/domain/AndroidDeploymentIntent.ts:5:1`

## createDeploymentChanges

Kind: `function`
Module: `src/engine/createDeploymentChanges.ts`
Source: `src/engine/createDeploymentChanges.ts:18:1`

### Signatures

- `(input: CreateDeploymentChangesInput) => readonly DeploymentTargetChange[]`
  - input: `CreateDeploymentChangesInput`
  - returns: `readonly DeploymentTargetChange[]`

## CreateDeploymentChangesInput

Kind: `type`
Module: `src/engine/createDeploymentChanges.ts`
Source: `src/engine/createDeploymentChanges.ts:12:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| current | property | `DeploymentCurrentState` | yes |  |
| desired | property | `AppDeployManifest` | yes |  |
| desiredRevisions | property | `Partial<Record<"android" \| "ios" \| "web", string>>` | no |  |

## createDeploymentPlan

Kind: `function`
Module: `src/engine/createDeploymentPlan.ts`
Source: `src/engine/createDeploymentPlan.ts:17:1`

### Signatures

- `(input: CreateDeploymentPlanInput) => DeploymentPlan`
  - input: `CreateDeploymentPlanInput`
  - returns: `DeploymentPlan`

## CreateDeploymentPlanInput

Kind: `type`
Module: `src/engine/createDeploymentPlan.ts`
Source: `src/engine/createDeploymentPlan.ts:10:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| contributors | property | `Partial<Record<"android" \| "ios" \| "web", import("..").DeploymentTargetPlanContributor>>` | yes |  |
| current | property | `DeploymentCurrentState` | yes |  |
| desired | property | `AppDeployManifest` | yes |  |
| desiredRevisions | property | `Partial<Record<"android" \| "ios" \| "web", string>>` | no |  |

## createProjectAndroidDeploymentPlan

Kind: `function`
Module: `src/project/android/createProjectAndroidDeploymentPlan.ts`
Source: `src/project/android/createProjectAndroidDeploymentPlan.ts:6:1`

### Signatures

- `(inspection: ProjectAndroidDeploymentInspection) => DeploymentPlan`
  - inspection: `ProjectAndroidDeploymentInspection`
  - returns: `DeploymentPlan`

## createProjectIosDeploymentPlan

Kind: `function`
Module: `src/project/ios/createProjectIosDeploymentPlan.ts`
Source: `src/project/ios/createProjectIosDeploymentPlan.ts:6:1`

### Signatures

- `(inspection: ProjectIosDeploymentInspection) => DeploymentPlan`
  - inspection: `ProjectIosDeploymentInspection`
  - returns: `DeploymentPlan`

## createProjectMonetizationPlan

Kind: `function`
Module: `src/project/monetization/createProjectMonetizationPlan.ts`
Source: `src/project/monetization/createProjectMonetizationPlan.ts:5:1`

### Signatures

- `(inspection: ProjectMonetizationInspection) => ProjectMonetizationPlan`
  - inspection: `ProjectMonetizationInspection`
  - returns: `ProjectMonetizationPlan`

## createProjectReleaseHistoryRecord

Kind: `function`
Module: `src/project/releaseHistory/createProjectReleaseHistoryRecord.ts`
Source: `src/project/releaseHistory/createProjectReleaseHistoryRecord.ts:7:1`

### Signatures

- `(options: { readonly executionId: string; readonly recordedAt: string; readonly desired: ReleaseDesiredState; readonly initialPlan: ReleasePlan; readonly result: ReleaseReconcileResult; }) => ProjectReleaseHistoryRecord`
  - options: `{ readonly executionId: string; readonly recordedAt: string; readonly desired: ReleaseDesiredState; readonly initialPlan: ReleasePlan; readonly result: ReleaseReconcileResult; }`
  - returns: `ProjectReleaseHistoryRecord`

## createProjectReleasePlan

Kind: `function`
Module: `src/project/release/createProjectReleasePlan.ts`
Source: `src/project/release/createProjectReleasePlan.ts:5:1`

### Signatures

- `(inspection: ProjectReleaseInspection) => ReleasePlan`
  - inspection: `ProjectReleaseInspection`
  - returns: `ReleasePlan`

## createProjectWebDeploymentPlan

Kind: `function`
Module: `src/project/web/createProjectWebDeploymentPlan.ts`
Source: `src/project/web/createProjectWebDeploymentPlan.ts:6:1`

### Signatures

- `(inspection: ProjectWebDeploymentInspection) => DeploymentPlan`
  - inspection: `ProjectWebDeploymentInspection`
  - returns: `DeploymentPlan`

## createReleaseCurrentRevision

Kind: `function`
Module: `src/domain/release/createReleaseCurrentRevision.ts`
Source: `src/domain/release/createReleaseCurrentRevision.ts:9:1`

### Signatures

- `(state: ReleaseObservedState, selectedTargets: readonly ReleaseTarget[]) => string`
  - selectedTargets: `readonly ReleaseTarget[]`
  - state: `ReleaseObservedState`
  - returns: `string`

## createReleaseExecutionState

Kind: `function`
Module: `src/domain/release/createReleaseExecutionState.ts`
Source: `src/domain/release/createReleaseExecutionState.ts:4:1`

### Signatures

- `(releaseRevision: string, steps: readonly ReleasePlanStep[]) => ReleaseExecutionState`
  - releaseRevision: `string`
  - steps: `readonly ReleasePlanStep[]`
  - returns: `ReleaseExecutionState`

## createReleasePlan

Kind: `function`
Module: `src/domain/release/createReleasePlan.ts`
Source: `src/domain/release/createReleasePlan.ts:14:1`

### Signatures

- `(desired: ReleaseDesiredState, current: ReleaseObservedState) => ReleasePlan`
  - current: `ReleaseObservedState`
  - desired: `ReleaseDesiredState`
  - returns: `ReleasePlan`

## createReleaseRevision

Kind: `function`
Module: `src/domain/release/createReleaseRevision.ts`
Source: `src/domain/release/createReleaseRevision.ts:7:1`

### Signatures

- `(options: { readonly version: string; readonly targets: readonly ReleaseTarget[]; readonly notes: readonly ReleaseNote[]; readonly rollout: ReleaseRollout; }) => string`
  - options: `{ readonly version: string; readonly targets: readonly ReleaseTarget[]; readonly notes: readonly ReleaseNote[]; readonly rollout: ReleaseRollout; }`
  - returns: `string`

## DEPLOY_CLI_ENVIRONMENT

Kind: `value`
Module: `src/cli/DeployCliEnvironment.ts`
Source: `src/cli/DeployCliEnvironment.ts:22:14`

## DEPLOY_CLI_EXIT_CODES

Kind: `value`
Module: `src/cli/DeployCliExitCodes.ts`
Source: `src/cli/DeployCliExitCodes.ts:11:14`

## DeployCliExitCode

Kind: `unknown`
Module: `src/cli/DeployCliExitCode.ts`
Source: `src/cli/DeployCliExitCode.ts:4:1`

## DeployCliJsonEnvelope

Kind: `type`
Module: `src/cli/DeployCliJsonEnvelope.ts`
Source: `src/cli/DeployCliJsonEnvelope.ts:16:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| actions | property | `readonly DeploymentRequiredAction[]` | no |  |
| execution | property | `{ readonly id: string; readonly status: "completed" \| "waiting" \| "blocked" \| "failed" \| "drifted"; readonly currentRevision: string; readonly executedStepIds: readonly string[]; readonly attemptedStepId?: string; readonly code?: string; readonly historyRecorded: boolean; }` | no |  |
| exitCode | property | `DeployCliExitCode` | yes |  |
| failure | property | `DeploymentFailure` | no |  |
| kind | property | `"ankh-deploy-result"` | yes |  |
| phase | property | `"input" \| "inspect" \| "plan" \| "confirmation" \| "execute" \| "history"` | yes |  |
| plan | property | `ReleasePlan` | no |  |
| release | property | `{ readonly version: string; readonly targets: readonly ReleaseTarget[]; readonly revision: string; }` | no |  |
| status | property | `"completed" \| "no-change" \| "blocked" \| "failed" \| "waiting" \| "drifted" \| "planned" \| "action-required" \| "confirmation-required" \| "declined" \| "history-failed"` | yes |  |
| version | property | `1` | yes |  |

## DEPLOYMENT_CAPABILITIES

Kind: `value`
Module: `src/domain/DeploymentCapability.ts`
Source: `src/domain/DeploymentCapability.ts:1:14`

## DEPLOYMENT_CHANGE_KINDS

Kind: `value`
Module: `src/domain/DeploymentTargetChange.ts`
Source: `src/domain/DeploymentTargetChange.ts:5:14`

## DEPLOYMENT_CHANGE_REASONS

Kind: `value`
Module: `src/domain/DeploymentTargetChange.ts`
Source: `src/domain/DeploymentTargetChange.ts:8:14`

## DEPLOYMENT_PLAN_DIAGNOSTIC_CODES

Kind: `value`
Module: `src/domain/DeploymentPlanDiagnostic.ts`
Source: `src/domain/DeploymentPlanDiagnostic.ts:3:14`

## DEPLOYMENT_STEP_OPERATIONS

Kind: `value`
Module: `src/domain/DeploymentPlanStep.ts`
Source: `src/domain/DeploymentPlanStep.ts:5:14`

## DeploymentAuthenticationRequiredAction

Kind: `type`
Module: `src/domain/DeploymentRequiredAction.ts`
Source: `src/domain/DeploymentRequiredAction.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| code | property | `string` | yes |  |
| message | property | `string` | yes |  |
| provider | property | `string` | yes |  |
| target | property | `"android" \| "ios" \| "web"` | no |  |
| type | property | `"authentication"` | yes |  |

## DeploymentAuthenticationState

Kind: `unknown`
Module: `src/domain/DeploymentAuthenticationState.ts`
Source: `src/domain/DeploymentAuthenticationState.ts:3:1`

## DeploymentAutomatedProvisioningRequirement

Kind: `type`
Module: `src/domain/DeploymentProvisioningRequirement.ts`
Source: `src/domain/DeploymentProvisioningRequirement.ts:8:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| code | property | `string` | yes |  |
| id | property | `string` | yes |  |
| message | property | `string` | yes |  |
| provider | property | `string` | yes |  |
| target | property | `"android" \| "ios" \| "web"` | no |  |
| type | property | `"automated"` | yes |  |

## DeploymentCapability

Kind: `unknown`
Module: `src/domain/DeploymentCapability.ts`
Source: `src/domain/DeploymentCapability.ts:9:1`

## DeploymentChangeKind

Kind: `unknown`
Module: `src/domain/DeploymentTargetChange.ts`
Source: `src/domain/DeploymentTargetChange.ts:6:1`

## DeploymentChangeReason

Kind: `unknown`
Module: `src/domain/DeploymentTargetChange.ts`
Source: `src/domain/DeploymentTargetChange.ts:16:1`

## DeploymentCredentialReference

Kind: `type`
Module: `src/domain/DeploymentCredentialReference.ts`
Source: `src/domain/DeploymentCredentialReference.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| id | property | `string` | yes |  |
| kind | property | `string` | yes |  |
| provider | property | `string` | yes |  |

## DeploymentCurrentState

Kind: `type`
Module: `src/domain/DeploymentCurrentState.ts`
Source: `src/domain/DeploymentCurrentState.ts:26:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| targets | property | `{ readonly web?: DeploymentObservedWebTarget; readonly android?: DeploymentObservedAndroidTarget; readonly ios?: DeploymentObservedIosTarget; }` | yes |  |

## DeploymentDesiredRevisions

Kind: `unknown`
Module: `src/domain/DeploymentDesiredRevisions.ts`
Source: `src/domain/DeploymentDesiredRevisions.ts:3:1`

## DeploymentExecutionResult

Kind: `unknown`
Module: `src/domain/DeploymentExecutionResult.ts`
Source: `src/domain/DeploymentExecutionResult.ts:12:1`

## DeploymentFailure

Kind: `type`
Module: `src/domain/DeploymentFailure.ts`
Source: `src/domain/DeploymentFailure.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| code | property | `string` | yes |  |
| message | property | `string` | yes |  |
| provider | property | `string` | no |  |
| target | property | `"android" \| "ios" \| "web"` | no |  |

## DeploymentManualAction

Kind: `type`
Module: `src/domain/DeploymentRequiredAction.ts`
Source: `src/domain/DeploymentRequiredAction.ts:11:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| code | property | `string` | yes |  |
| message | property | `string` | yes |  |
| provider | property | `string` | no |  |
| target | property | `"android" \| "ios" \| "web"` | yes |  |
| type | property | `"manual-action"` | yes |  |
| url | property | `string` | no |  |

## DeploymentObservedAndroidTarget

Kind: `type`
Module: `src/domain/DeploymentCurrentState.ts`
Source: `src/domain/DeploymentCurrentState.ts:11:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| package | property | `string` | yes |  |
| providers | property | `AppDeployProviderSelection` | no |  |
| revision | property | `string` | no |  |

## DeploymentObservedIosTarget

Kind: `type`
Module: `src/domain/DeploymentCurrentState.ts`
Source: `src/domain/DeploymentCurrentState.ts:16:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| bundleIdentifier | property | `string` | yes |  |
| providers | property | `AppDeployProviderSelection` | no |  |
| revision | property | `string` | no |  |

## DeploymentObservedRevision

Kind: `type`
Module: `src/domain/DeploymentCurrentState.ts`
Source: `src/domain/DeploymentCurrentState.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| revision | property | `string` | no |  |

## DeploymentObservedTarget

Kind: `unknown`
Module: `src/domain/DeploymentCurrentState.ts`
Source: `src/domain/DeploymentCurrentState.ts:21:1`

## DeploymentObservedWebTarget

Kind: `type`
Module: `src/domain/DeploymentCurrentState.ts`
Source: `src/domain/DeploymentCurrentState.ts:7:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| providers | property | `AppDeployProviderSelection` | no |  |
| revision | property | `string` | no |  |

## DeploymentPhase

Kind: `unknown`
Module: `src/domain/DeploymentPlanStep.ts`
Source: `src/domain/DeploymentPlanStep.ts:8:1`

## DeploymentPlan

Kind: `type`
Module: `src/domain/DeploymentPlan.ts`
Source: `src/domain/DeploymentPlan.ts:5:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| changes | property | `readonly DeploymentTargetChange[]` | yes |  |
| diagnostics | property | `readonly DeploymentPlanDiagnostic[]` | yes |  |
| executable | property | `boolean` | yes |  |
| steps | property | `readonly DeploymentPlanStep[]` | yes |  |

## DeploymentPlanDiagnostic

Kind: `type`
Module: `src/domain/DeploymentPlanDiagnostic.ts`
Source: `src/domain/DeploymentPlanDiagnostic.ts:15:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| code | property | `"TARGET_PLANNER_UNAVAILABLE" \| "CONTRIBUTOR_TARGET_MISMATCH" \| "TARGET_PLANNER_FAILED" \| "STEP_TARGET_MISMATCH" \| "DUPLICATE_STEP_ID" \| "UNDECLARED_CAPABILITY" \| "INVALID_STEP_ID"` | yes |  |
| message | property | `string` | yes |  |
| stepId | property | `string` | no |  |
| target | property | `"android" \| "ios" \| "web"` | yes |  |

## DeploymentPlanDiagnosticCode

Kind: `unknown`
Module: `src/domain/DeploymentPlanDiagnostic.ts`
Source: `src/domain/DeploymentPlanDiagnostic.ts:13:1`

## DeploymentPlanStep

Kind: `type`
Module: `src/domain/DeploymentPlanStep.ts`
Source: `src/domain/DeploymentPlanStep.ts:10:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| id | property | `string` | yes |  |
| operation | property | `"create" \| "update" \| "remove" \| "run"` | yes |  |
| phase | property | `"prepare" \| "build" \| "publish" \| "verify" \| "provision"` | yes |  |
| provider | property | `string` | no |  |
| reason | property | `string` | yes |  |
| target | property | `"android" \| "ios" \| "web"` | yes |  |

## DeploymentProviderCapabilityState

Kind: `type`
Module: `src/domain/DeploymentProviderCapabilityState.ts`
Source: `src/domain/DeploymentProviderCapabilityState.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| capability | property | `"prepare" \| "build" \| "publish" \| "verify" \| "provision"` | yes |  |
| reason | property | `string` | no |  |
| status | property | `"available" \| "unavailable"` | yes |  |

## DeploymentProviderSetupAdapter

Kind: `type`
Module: `src/domain/DeploymentProviderSetupAdapter.ts`
Source: `src/domain/DeploymentProviderSetupAdapter.ts:4:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| inspectSetup | method | `(context: DeploymentProviderSetupContext) => Promise<DeploymentProviderSetupInspection>` | yes |  |
| provider | property | `string` | yes |  |

## DeploymentProviderSetupContext

Kind: `type`
Module: `src/domain/DeploymentProviderSetupContext.ts`
Source: `src/domain/DeploymentProviderSetupContext.ts:6:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credentials | property | `readonly DeploymentCredentialReference[]` | yes |  |
| projectRoot | property | `string` | yes |  |
| resolveSecret | property | `DeploymentSecretResolver` | yes |  |
| target | property | `"android" \| "ios" \| "web"` | no |  |

## DeploymentProviderSetupInspection

Kind: `type`
Module: `src/domain/DeploymentProviderSetupInspection.ts`
Source: `src/domain/DeploymentProviderSetupInspection.ts:5:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| authentication | property | `DeploymentAuthenticationState` | yes |  |
| capabilities | property | `readonly DeploymentProviderCapabilityState[]` | yes |  |
| provider | property | `string` | yes |  |
| provisioning | property | `readonly DeploymentProvisioningRequirement[]` | yes |  |

## DeploymentProviderSetupInspectionResult

Kind: `unknown`
Module: `src/domain/DeploymentProviderSetupInspectionResult.ts`
Source: `src/domain/DeploymentProviderSetupInspectionResult.ts:4:1`

## DeploymentProvisioningRequirement

Kind: `unknown`
Module: `src/domain/DeploymentProvisioningRequirement.ts`
Source: `src/domain/DeploymentProvisioningRequirement.ts:17:1`

## DeploymentRequiredAction

Kind: `unknown`
Module: `src/domain/DeploymentRequiredAction.ts`
Source: `src/domain/DeploymentRequiredAction.ts:20:1`

## DeploymentSecretMaterial

Kind: `unknown`
Module: `src/domain/DeploymentSecretResolver.ts`
Source: `src/domain/DeploymentSecretResolver.ts:3:1`

## DeploymentSecretResolver

Kind: `unknown`
Module: `src/domain/DeploymentSecretResolver.ts`
Source: `src/domain/DeploymentSecretResolver.ts:5:1`

## DeploymentStepExecutionRecord

Kind: `type`
Module: `src/domain/DeploymentExecutionResult.ts`
Source: `src/domain/DeploymentExecutionResult.ts:7:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| outcome | property | `DeploymentStepOutcome` | yes |  |
| step | property | `DeploymentPlanStep` | yes |  |

## DeploymentStepExecutor

Kind: `unknown`
Module: `src/engine/executeDeploymentPlan.ts`
Source: `src/engine/executeDeploymentPlan.ts:9:1`

## DeploymentStepOperation

Kind: `unknown`
Module: `src/domain/DeploymentPlanStep.ts`
Source: `src/domain/DeploymentPlanStep.ts:6:1`

## DeploymentStepOutcome

Kind: `unknown`
Module: `src/domain/DeploymentStepOutcome.ts`
Source: `src/domain/DeploymentStepOutcome.ts:4:1`

## DeploymentTargetChange

Kind: `type`
Module: `src/domain/DeploymentTargetChange.ts`
Source: `src/domain/DeploymentTargetChange.ts:18:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| current | property | `DeploymentObservedTarget \| null` | yes |  |
| desired | property | `DeploymentObservedTarget \| null` | yes |  |
| kind | property | `"create" \| "update" \| "remove" \| "none"` | yes |  |
| reason | property | `"already-absent" \| "target-missing" \| "target-not-desired" \| "configuration-changed" \| "revision-changed" \| "already-current"` | yes |  |
| target | property | `"android" \| "ios" \| "web"` | yes |  |

## DeploymentTargetPlanContributor

Kind: `type`
Module: `src/domain/DeploymentTargetPlanContributor.ts`
Source: `src/domain/DeploymentTargetPlanContributor.ts:7:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| capabilities | property | `readonly ("prepare" \| "build" \| "publish" \| "verify" \| "provision")[]` | yes |  |
| createSteps | method | `(change: DeploymentTargetChange) => readonly DeploymentPlanStep[]` | yes |  |
| target | property | `"android" \| "ios" \| "web"` | yes |  |

## DeploymentTargetPlanContributors

Kind: `unknown`
Module: `src/domain/DeploymentTargetPlanContributor.ts`
Source: `src/domain/DeploymentTargetPlanContributor.ts:13:1`

## DeploymentVerificationIssue

Kind: `type`
Module: `src/domain/DeploymentVerificationResult.ts`
Source: `src/domain/DeploymentVerificationResult.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| code | property | `string` | yes |  |
| message | property | `string` | yes |  |
| provider | property | `string` | no |  |
| target | property | `"android" \| "ios" \| "web"` | no |  |

## DeploymentVerificationResult

Kind: `unknown`
Module: `src/domain/DeploymentVerificationResult.ts`
Source: `src/domain/DeploymentVerificationResult.ts:10:1`

## executeDeploymentPlan

Kind: `function`
Module: `src/engine/executeDeploymentPlan.ts`
Source: `src/engine/executeDeploymentPlan.ts:16:1`

### Signatures

- `(input: ExecuteDeploymentPlanInput) => Promise<DeploymentExecutionResult>`
  - input: `ExecuteDeploymentPlanInput`
  - returns: `Promise<DeploymentExecutionResult>`

## ExecuteDeploymentPlanInput

Kind: `type`
Module: `src/engine/executeDeploymentPlan.ts`
Source: `src/engine/executeDeploymentPlan.ts:11:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| executeStep | property | `DeploymentStepExecutor` | yes |  |
| plan | property | `DeploymentPlan` | yes |  |

## executeProjectAndroidDeployment

Kind: `function`
Module: `src/project/android/executeProjectAndroidDeployment.ts`
Source: `src/project/android/executeProjectAndroidDeployment.ts:25:1`

### Signatures

- `(options: ExecuteProjectAndroidDeploymentOptions) => Promise<ProjectAndroidDeploymentExecution>`
  - options: `ExecuteProjectAndroidDeploymentOptions`
  - returns: `Promise<ProjectAndroidDeploymentExecution>`

## ExecuteProjectAndroidDeploymentOptions

Kind: `type`
Module: `src/project/android/executeProjectAndroidDeployment.ts`
Source: `src/project/android/executeProjectAndroidDeployment.ts:20:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| inspection | property | `ProjectAndroidDeploymentInspection` | yes |  |
| plan | property | `DeploymentPlan` | yes |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |

## executeProjectIosDeployment

Kind: `function`
Module: `src/project/ios/executeProjectIosDeployment.ts`
Source: `src/project/ios/executeProjectIosDeployment.ts:25:1`

### Signatures

- `(options: ExecuteProjectIosDeploymentOptions) => Promise<ProjectIosDeploymentExecution>`
  - options: `ExecuteProjectIosDeploymentOptions`
  - returns: `Promise<ProjectIosDeploymentExecution>`

## ExecuteProjectIosDeploymentOptions

Kind: `type`
Module: `src/project/ios/executeProjectIosDeployment.ts`
Source: `src/project/ios/executeProjectIosDeployment.ts:20:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| inspection | property | `ProjectIosDeploymentInspection` | yes |  |
| plan | property | `DeploymentPlan` | yes |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |

## executeProjectMonetizationSync

Kind: `function`
Module: `src/project/monetization/executeProjectMonetizationSync.ts`
Source: `src/project/monetization/executeProjectMonetizationSync.ts:6:1`

### Signatures

- `(options: ExecuteProjectMonetizationSyncOptions) => Promise<ProjectMonetizationExecutionResult>`
  - options: `ExecuteProjectMonetizationSyncOptions`
  - returns: `Promise<ProjectMonetizationExecutionResult>`

## ExecuteProjectMonetizationSyncOptions

Kind: `type`
Module: `src/project/monetization/ExecuteProjectMonetizationSyncOptions.ts`
Source: `src/project/monetization/ExecuteProjectMonetizationSyncOptions.ts:5:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| inspection | property | `ProjectMonetizationInspection` | yes |  |
| plan | property | `ProjectMonetizationPlan` | yes |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |

## executeProjectRelease

Kind: `function`
Module: `src/project/release/executeProjectRelease.ts`
Source: `src/project/release/executeProjectRelease.ts:6:1`

### Signatures

- `(options: ExecuteProjectReleaseOptions) => Promise<ProjectReleaseExecutionResult>`
  - options: `ExecuteProjectReleaseOptions`
  - returns: `Promise<ProjectReleaseExecutionResult>`

## executeProjectReleaseControl

Kind: `function`
Module: `src/project/release/executeProjectReleaseControl.ts`
Source: `src/project/release/executeProjectReleaseControl.ts:6:1`

### Signatures

- `(options: ExecuteProjectReleaseControlOptions) => Promise<ReleaseControlExecutionResult>`
  - options: `ExecuteProjectReleaseControlOptions`
  - returns: `Promise<ReleaseControlExecutionResult>`

## ExecuteProjectReleaseControlOptions

Kind: `type`
Module: `src/project/release/ExecuteProjectReleaseControlOptions.ts`
Source: `src/project/release/ExecuteProjectReleaseControlOptions.ts:4:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| android | property | `ProjectReleaseAndroidContext` | no |  |
| control | property | `ReleaseLifecycleControl` | yes |  |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| ios | property | `ProjectReleaseIosContext` | no |  |
| projectRoot | property | `string` | yes |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |
| web | property | `ProjectReleaseWebContext` | no |  |

## ExecuteProjectReleaseOptions

Kind: `type`
Module: `src/project/release/ExecuteProjectReleaseOptions.ts`
Source: `src/project/release/ExecuteProjectReleaseOptions.ts:5:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| android | property | `ProjectReleaseAndroidContext` | no |  |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| executionId | property | `string` | yes |  |
| inspection | property | `ProjectReleaseInspection` | yes |  |
| ios | property | `ProjectReleaseIosContext` | no |  |
| plan | property | `ReleasePlan` | yes |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |
| web | property | `ProjectReleaseWebContext` | no |  |

## executeProjectWebDeployment

Kind: `function`
Module: `src/project/web/executeProjectWebDeployment.ts`
Source: `src/project/web/executeProjectWebDeployment.ts:28:1`

### Signatures

- `(options: ExecuteProjectWebDeploymentOptions) => Promise<ProjectWebDeploymentExecution>`
  - options: `ExecuteProjectWebDeploymentOptions`
  - returns: `Promise<ProjectWebDeploymentExecution>`

## ExecuteProjectWebDeploymentOptions

Kind: `type`
Module: `src/project/web/executeProjectWebDeployment.ts`
Source: `src/project/web/executeProjectWebDeployment.ts:22:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| inspection | property | `ProjectWebDeploymentInspection` | yes |  |
| intent | property | `WebDeploymentPublishIntent` | no |  |
| plan | property | `DeploymentPlan` | yes |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |

## executeReleaseLifecycleControl

Kind: `function`
Module: `src/engine/release/executeReleaseLifecycleControl.ts`
Source: `src/engine/release/executeReleaseLifecycleControl.ts:17:1`

### Signatures

- `(options: { readonly control: ReleaseLifecycleControl; readonly inspect: InspectTarget; readonly mutate: MutateControl; }) => Promise<ReleaseControlExecutionResult>`
  - options: `{ readonly control: ReleaseLifecycleControl; readonly inspect: InspectTarget; readonly mutate: MutateControl; }`
  - returns: `Promise<ReleaseControlExecutionResult>`

## executeReleasePlan

Kind: `function`
Module: `src/engine/release/executeReleasePlan.ts`
Source: `src/engine/release/executeReleasePlan.ts:18:1`

### Signatures

- `(options: { readonly desired: ReleaseDesiredState; readonly plan: ReleasePlan; readonly inspect: InspectRelease; readonly mutate: MutateRelease; }) => Promise<ReleaseReconcileResult>`
  - options: `{ readonly desired: ReleaseDesiredState; readonly plan: ReleasePlan; readonly inspect: InspectRelease; readonly mutate: MutateRelease; }`
  - returns: `Promise<ReleaseReconcileResult>`

## inspectDeploymentProviderSetup

Kind: `function`
Module: `src/engine/inspectDeploymentProviderSetup.ts`
Source: `src/engine/inspectDeploymentProviderSetup.ts:8:1`

### Signatures

- `(options: { readonly adapter: DeploymentProviderSetupAdapter; readonly context: DeploymentProviderSetupContext; }) => Promise<DeploymentProviderSetupInspectionResult>`
  - options: `{ readonly adapter: DeploymentProviderSetupAdapter; readonly context: DeploymentProviderSetupContext; }`
  - returns: `Promise<DeploymentProviderSetupInspectionResult>`

## inspectProjectAndroidDeployment

Kind: `function`
Module: `src/project/android/inspectProjectAndroidDeployment.ts`
Source: `src/project/android/inspectProjectAndroidDeployment.ts:31:1`

### Signatures

- `(options: InspectProjectAndroidDeploymentOptions) => Promise<ProjectAndroidDeploymentInspectionResult>`
  - options: `InspectProjectAndroidDeploymentOptions`
  - returns: `Promise<ProjectAndroidDeploymentInspectionResult>`

## InspectProjectAndroidDeploymentOptions

Kind: `type`
Module: `src/project/android/inspectProjectAndroidDeployment.ts`
Source: `src/project/android/inspectProjectAndroidDeployment.ts:26:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| intent | property | `AndroidDeploymentIntent` | yes |  |
| projectRoot | property | `string` | yes |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |

## inspectProjectIosDeployment

Kind: `function`
Module: `src/project/ios/inspectProjectIosDeployment.ts`
Source: `src/project/ios/inspectProjectIosDeployment.ts:31:1`

### Signatures

- `(options: InspectProjectIosDeploymentOptions) => Promise<ProjectIosDeploymentInspectionResult>`
  - options: `InspectProjectIosDeploymentOptions`
  - returns: `Promise<ProjectIosDeploymentInspectionResult>`

## InspectProjectIosDeploymentOptions

Kind: `type`
Module: `src/project/ios/inspectProjectIosDeployment.ts`
Source: `src/project/ios/inspectProjectIosDeployment.ts:26:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| intent | property | `IosDeploymentIntent` | yes |  |
| projectRoot | property | `string` | yes |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |

## inspectProjectMonetization

Kind: `function`
Module: `src/project/monetization/inspectProjectMonetization.ts`
Source: `src/project/monetization/inspectProjectMonetization.ts:6:1`

### Signatures

- `(options: InspectProjectMonetizationOptions) => Promise<ProjectMonetizationInspectionResult>`
  - options: `InspectProjectMonetizationOptions`
  - returns: `Promise<ProjectMonetizationInspectionResult>`

## InspectProjectMonetizationOptions

Kind: `type`
Module: `src/project/monetization/InspectProjectMonetizationOptions.ts`
Source: `src/project/monetization/InspectProjectMonetizationOptions.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| projectRoot | property | `string` | yes |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |

## inspectProjectRelease

Kind: `function`
Module: `src/project/release/inspectProjectRelease.ts`
Source: `src/project/release/inspectProjectRelease.ts:6:1`

### Signatures

- `(options: InspectProjectReleaseOptions) => Promise<ProjectReleaseInspectionResult>`
  - options: `InspectProjectReleaseOptions`
  - returns: `Promise<ProjectReleaseInspectionResult>`

## InspectProjectReleaseOptions

Kind: `type`
Module: `src/project/release/InspectProjectReleaseOptions.ts`
Source: `src/project/release/InspectProjectReleaseOptions.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| android | property | `ProjectReleaseAndroidContext` | no |  |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| ios | property | `ProjectReleaseIosContext` | no |  |
| projectRoot | property | `string` | yes |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |
| web | property | `ProjectReleaseWebContext` | no |  |

## inspectProjectWebDeployment

Kind: `function`
Module: `src/project/web/inspectProjectWebDeployment.ts`
Source: `src/project/web/inspectProjectWebDeployment.ts:21:1`

### Signatures

- `(options: InspectProjectWebDeploymentOptions) => Promise<ProjectWebDeploymentInspectionResult>`
  - options: `InspectProjectWebDeploymentOptions`
  - returns: `Promise<ProjectWebDeploymentInspectionResult>`

## InspectProjectWebDeploymentOptions

Kind: `type`
Module: `src/project/web/inspectProjectWebDeployment.ts`
Source: `src/project/web/inspectProjectWebDeployment.ts:17:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| projectRoot | property | `string` | yes |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |

## IosDeploymentIntent

Kind: `type`
Module: `src/domain/IosDeploymentIntent.ts`
Source: `src/domain/IosDeploymentIntent.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| buildProfile | property | `string` | yes |  |
| version | property | `string` | yes |  |

## IosDeploymentPublication

Kind: `type`
Module: `node_modules/@ankhorage/contracts/dist/types/deployProvider.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/types/deployProvider.d.ts:241:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| buildId | property | `string` | yes |  |
| buildNumber | property | `string` | yes |  |
| buildProvider | property | `string` | yes |  |
| publishProvider | property | `string` | yes |  |
| revision | property | `string` | yes |  |
| target | property | `"ios"` | yes |  |
| version | property | `string` | yes |  |

## isReleaseStepResumable

Kind: `function`
Module: `src/domain/release/isReleaseStepResumable.ts`
Source: `src/domain/release/isReleaseStepResumable.ts:3:1`

### Signatures

- `(step: ReleaseExecutionStep) => boolean`
  - step: `ReleaseExecutionStep`
  - returns: `boolean`

## listProjectDeploymentHistory

Kind: `function`
Module: `src/project/listProjectDeploymentHistory.ts`
Source: `src/project/listProjectDeploymentHistory.ts:9:1`

List canonical deployment history records for one validated Deploy project.

### Signatures

- `(options: { readonly projectRoot: string; }) => Promise<readonly ProjectDeploymentHistoryRecord[]>`
  - options: `{ readonly projectRoot: string; }`
  - returns: `Promise<readonly ProjectDeploymentHistoryRecord[]>`

## listProjectReleaseHistory

Kind: `function`
Module: `src/project/releaseHistory/listProjectReleaseHistory.ts`
Source: `src/project/releaseHistory/listProjectReleaseHistory.ts:9:1`

### Signatures

- `(options: { readonly projectRoot: string; }) => Promise<readonly ProjectReleaseHistoryRecord[]>`
  - options: `{ readonly projectRoot: string; }`
  - returns: `Promise<readonly ProjectReleaseHistoryRecord[]>`

## listReleaseLifecycleControls

Kind: `function`
Module: `src/domain/release/listReleaseLifecycleControls.ts`
Source: `src/domain/release/listReleaseLifecycleControls.ts:4:1`

### Signatures

- `(observed: ReleaseObservedTargetState) => readonly ReleaseLifecycleControl[]`
  - observed: `ReleaseObservedTargetState`
  - returns: `readonly ReleaseLifecycleControl[]`

## MonetizationBasePrice

Kind: `type`
Module: `src/domain/monetization/MonetizationBasePrice.ts`
Source: `src/domain/monetization/MonetizationBasePrice.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| amount | property | `string` | yes |  |
| country | property | `string` | yes |  |
| currency | property | `string` | yes |  |

## MonetizationDesiredState

Kind: `type`
Module: `src/domain/monetization/MonetizationDesiredState.ts`
Source: `src/domain/monetization/MonetizationDesiredState.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| products | property | `readonly MonetizationProduct[]` | yes |  |
| revision | property | `string` | yes |  |

## MonetizationDiagnostic

Kind: `type`
Module: `src/domain/monetization/MonetizationDiagnostic.ts`
Source: `src/domain/monetization/MonetizationDiagnostic.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| code | property | `string` | yes |  |
| locale | property | `string` | no |  |
| message | property | `string` | yes |  |
| productId | property | `string` | no |  |
| severity | property | `"warning" \| "error"` | yes |  |
| target | property | `"android" \| "ios"` | no |  |

## MonetizationLocalization

Kind: `type`
Module: `src/domain/monetization/MonetizationLocalization.ts`
Source: `src/domain/monetization/MonetizationLocalization.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| description | property | `string` | yes |  |
| locale | property | `string` | yes |  |
| name | property | `string` | yes |  |

## MonetizationObservedProduct

Kind: `type`
Module: `src/domain/monetization/MonetizationObservedProduct.ts`
Source: `src/domain/monetization/MonetizationObservedProduct.ts:6:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| basePrice | property | `MonetizationBasePrice` | no |  |
| id | property | `string` | yes |  |
| kind | property | `MonetizationProductKind \| "one-time"` | yes |  |
| localizations | property | `readonly MonetizationLocalization[]` | yes |  |
| subscription | property | `MonetizationSubscription` | no |  |

## MonetizationPlan

Kind: `type`
Module: `src/domain/monetization/MonetizationPlan.ts`
Source: `src/domain/monetization/MonetizationPlan.ts:4:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| currentRevision | property | `string` | yes |  |
| desiredRevision | property | `string` | yes |  |
| diagnostics | property | `readonly MonetizationDiagnostic[]` | yes |  |
| status | property | `"no-change" \| "changes" \| "blocked"` | yes |  |
| steps | property | `readonly MonetizationPlanStep[]` | yes |  |

## MonetizationPlanStep

Kind: `type`
Module: `src/domain/monetization/MonetizationPlanStep.ts`
Source: `src/domain/monetization/MonetizationPlanStep.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| id | property | `string` | yes |  |
| operation | property | `"ensure-subscription-family" \| "create-product" \| "update-metadata" \| "update-price" \| "update-subscription"` | yes |  |
| productId | property | `string` | yes |  |
| target | property | `"android" \| "ios"` | yes |  |

## MonetizationProduct

Kind: `type`
Module: `src/domain/monetization/MonetizationProduct.ts`
Source: `src/domain/monetization/MonetizationProduct.ts:7:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| basePrice | property | `MonetizationBasePrice` | yes |  |
| id | property | `string` | yes |  |
| kind | property | `MonetizationProductKind` | yes |  |
| localizations | property | `readonly MonetizationLocalization[]` | yes |  |
| subscription | property | `MonetizationSubscription` | no |  |

## MonetizationProductKind

Kind: `unknown`
Module: `src/domain/monetization/MonetizationProduct.ts`
Source: `src/domain/monetization/MonetizationProduct.ts:5:1`

## MonetizationSubscription

Kind: `type`
Module: `src/domain/monetization/MonetizationSubscription.ts`
Source: `src/domain/monetization/MonetizationSubscription.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| family | property | `string` | yes |  |
| level | property | `number` | no |  |
| period | property | `MonetizationSubscriptionPeriod` | yes |  |

## MonetizationSubscriptionPeriod

Kind: `unknown`
Module: `src/domain/monetization/MonetizationSubscription.ts`
Source: `src/domain/monetization/MonetizationSubscription.ts:1:1`

## MonetizationTargetState

Kind: `type`
Module: `src/domain/monetization/MonetizationTargetState.ts`
Source: `src/domain/monetization/MonetizationTargetState.ts:4:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| diagnostics | property | `readonly MonetizationDiagnostic[]` | yes |  |
| products | property | `readonly MonetizationObservedProduct[]` | yes |  |
| subscriptionFamilies | property | `readonly string[]` | yes |  |
| target | property | `"android" \| "ios"` | yes |  |

## PROJECT_DEPLOYMENT_HISTORY_SCHEMA_VERSION

Kind: `value`
Module: `src/project/history/historySchemaVersion.ts`
Source: `src/project/history/historySchemaVersion.ts:1:14`

## ProjectAndroidDeploymentAccess

Kind: `type`
Module: `src/project/android/ProjectAndroidDeploymentAccess.ts`
Source: `src/project/android/ProjectAndroidDeploymentAccess.ts:4:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |

## ProjectAndroidDeploymentExecution

Kind: `type`
Module: `src/project/android/ProjectAndroidDeploymentExecution.ts`
Source: `src/project/android/ProjectAndroidDeploymentExecution.ts:6:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| execution | property | `DeploymentExecutionResult` | yes |  |
| historyFailure | property | `DeploymentFailure` | no |  |
| historyRecorded | property | `boolean` | yes |  |
| publication | property | `AndroidDeploymentPublication \| null` | yes |  |
| verification | property | `DeploymentVerificationResult \| null` | yes |  |

## ProjectAndroidDeploymentInspection

Kind: `type`
Module: `src/project/android/ProjectAndroidDeploymentInspection.ts`
Source: `src/project/android/ProjectAndroidDeploymentInspection.ts:8:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| current | property | `DeploymentCurrentState` | yes |  |
| desired | property | `AppDeployManifest` | yes |  |
| desiredRevision | property | `string` | no |  |
| intent | property | `AndroidDeploymentIntent` | yes |  |
| projectRoot | property | `string` | yes |  |
| setups | property | `readonly DeploymentProviderSetupInspectionResult[]` | yes |  |

## ProjectAndroidDeploymentInspectionResult

Kind: `unknown`
Module: `src/project/android/ProjectAndroidDeploymentInspection.ts`
Source: `src/project/android/ProjectAndroidDeploymentInspection.ts:17:1`

## ProjectDeploymentConfigUpdater

Kind: `unknown`
Module: `src/project/updateProjectDeploymentConfig.ts`
Source: `src/project/updateProjectDeploymentConfig.ts:6:1`

## ProjectDeploymentHistoryRecord

Kind: `type`
Module: `src/project/history/ProjectDeploymentHistoryRecord.ts`
Source: `src/project/history/ProjectDeploymentHistoryRecord.ts:7:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| deploymentId | property | `string` | yes |  |
| desired | property | `AppDeployManifest \| null` | yes |  |
| execution | property | `DeploymentExecutionResult` | yes |  |
| plan | property | `DeploymentPlan` | yes |  |
| recordedAt | property | `string` | yes |  |
| schemaVersion | property | `1` | yes |  |
| verification | property | `DeploymentVerificationResult` | no |  |

## ProjectDeploymentPaths

Kind: `type`
Module: `src/project/ProjectDeploymentPaths.ts`
Source: `src/project/ProjectDeploymentPaths.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| androidAssetsRoot | property | `string` | yes |  |
| androidScreenshotsRoot | property | `string` | yes |  |
| assetsRoot | property | `string` | yes |  |
| authoredRoot | property | `string` | yes |  |
| historyRoot | property | `string` | yes |  |
| iosAssetsRoot | property | `string` | yes |  |
| iosScreenshotsRoot | property | `string` | yes |  |
| listingRoot | property | `string` | yes |  |
| manifestPath | property | `string` | yes |  |
| monetizationRoot | property | `string` | yes |  |
| productsPath | property | `string` | yes |  |
| projectRoot | property | `string` | yes |  |
| releasePath | property | `string` | yes |  |
| sharedAssetsRoot | property | `string` | yes |  |

## ProjectIosDeploymentAccess

Kind: `type`
Module: `src/project/ios/ProjectIosDeploymentAccess.ts`
Source: `src/project/ios/ProjectIosDeploymentAccess.ts:4:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |

## ProjectIosDeploymentExecution

Kind: `type`
Module: `src/project/ios/ProjectIosDeploymentExecution.ts`
Source: `src/project/ios/ProjectIosDeploymentExecution.ts:6:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| execution | property | `DeploymentExecutionResult` | yes |  |
| historyFailure | property | `DeploymentFailure` | no |  |
| historyRecorded | property | `boolean` | yes |  |
| publication | property | `IosDeploymentPublication \| null` | yes |  |
| verification | property | `DeploymentVerificationResult \| null` | yes |  |

## ProjectIosDeploymentInspection

Kind: `type`
Module: `src/project/ios/ProjectIosDeploymentInspection.ts`
Source: `src/project/ios/ProjectIosDeploymentInspection.ts:8:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| current | property | `DeploymentCurrentState` | yes |  |
| desired | property | `AppDeployManifest` | yes |  |
| desiredRevision | property | `string` | no |  |
| intent | property | `IosDeploymentIntent` | yes |  |
| projectRoot | property | `string` | yes |  |
| setups | property | `readonly DeploymentProviderSetupInspectionResult[]` | yes |  |

## ProjectIosDeploymentInspectionResult

Kind: `unknown`
Module: `src/project/ios/ProjectIosDeploymentInspection.ts`
Source: `src/project/ios/ProjectIosDeploymentInspection.ts:17:1`

## ProjectMonetizationAccess

Kind: `type`
Module: `src/project/monetization/ProjectMonetizationAccess.ts`
Source: `src/project/monetization/ProjectMonetizationAccess.ts:4:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |

## ProjectMonetizationExecutionResult

Kind: `unknown`
Module: `src/project/monetization/ProjectMonetizationExecutionResult.ts`
Source: `src/project/monetization/ProjectMonetizationExecutionResult.ts:6:1`

## ProjectMonetizationInspection

Kind: `type`
Module: `src/project/monetization/ProjectMonetizationInspection.ts`
Source: `src/project/monetization/ProjectMonetizationInspection.ts:6:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| actions | property | `readonly DeploymentRequiredAction[]` | yes |  |
| currentRevision | property | `string` | yes |  |
| desired | property | `MonetizationDesiredState` | yes |  |
| projectRoot | property | `string` | yes |  |
| states | property | `readonly MonetizationTargetState[]` | yes |  |
| targets | property | `ProjectMonetizationTargets` | yes |  |

## ProjectMonetizationInspectionResult

Kind: `unknown`
Module: `src/project/monetization/ProjectMonetizationInspectionResult.ts`
Source: `src/project/monetization/ProjectMonetizationInspectionResult.ts:4:1`

## ProjectMonetizationPlan

Kind: `type`
Module: `src/project/monetization/ProjectMonetizationPlan.ts`
Source: `src/project/monetization/ProjectMonetizationPlan.ts:4:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| actions | property | `readonly DeploymentRequiredAction[]` | yes |  |
| currentRevision | property | `string` | yes |  |
| desiredRevision | property | `string` | yes |  |
| diagnostics | property | `readonly MonetizationDiagnostic[]` | yes |  |
| status | property | `"no-change" \| "changes" \| "blocked"` | yes |  |
| steps | property | `readonly MonetizationPlanStep[]` | yes |  |

## ProjectMonetizationTargets

Kind: `type`
Module: `src/project/monetization/ProjectMonetizationTargets.ts`
Source: `src/project/monetization/ProjectMonetizationTargets.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| androidPackage | property | `string` | no |  |
| androidProvider | property | `string` | no |  |
| iosBundleIdentifier | property | `string` | no |  |
| iosProvider | property | `string` | no |  |

## ProjectReleaseAccess

Kind: `type`
Module: `src/project/release/ProjectReleaseAccess.ts`
Source: `src/project/release/ProjectReleaseAccess.ts:7:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| android | property | `ProjectReleaseAndroidContext` | no |  |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| ios | property | `ProjectReleaseIosContext` | no |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |
| web | property | `ProjectReleaseWebContext` | no |  |

## ProjectReleaseAndroidContext

Kind: `type`
Module: `src/project/release/ProjectReleaseAndroidContext.ts`
Source: `src/project/release/ProjectReleaseAndroidContext.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| buildProfile | property | `string` | no |  |
| track | property | `"internal" \| "alpha" \| "beta" \| "production"` | yes |  |

## ProjectReleaseExecution

Kind: `type`
Module: `src/project/release/ProjectReleaseExecution.ts`
Source: `src/project/release/ProjectReleaseExecution.ts:4:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| historyFailure | property | `DeploymentFailure` | no |  |
| historyRecorded | property | `boolean` | yes |  |
| result | property | `ReleaseReconcileResult` | yes |  |

## ProjectReleaseExecutionResult

Kind: `unknown`
Module: `src/project/release/ProjectReleaseExecutionResult.ts`
Source: `src/project/release/ProjectReleaseExecutionResult.ts:4:1`

## ProjectReleaseHistoryRecord

Kind: `type`
Module: `src/project/releaseHistory/ProjectReleaseHistoryRecord.ts`
Source: `src/project/releaseHistory/ProjectReleaseHistoryRecord.ts:6:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| desired | property | `ReleaseDesiredState` | yes |  |
| execution | property | `ReleaseExecutionState` | yes |  |
| executionId | property | `string` | yes |  |
| initialPlan | property | `ReleasePlan` | yes |  |
| recordedAt | property | `string` | yes |  |
| result | property | `ReleaseReconcileResult` | yes |  |
| schemaVersion | property | `1` | yes |  |

## ProjectReleaseInput

Kind: `unknown`
Module: `src/project/release/ProjectReleaseInput.ts`
Source: `src/project/release/ProjectReleaseInput.ts:3:1`

## ProjectReleaseInspection

Kind: `type`
Module: `src/project/release/ProjectReleaseInspection.ts`
Source: `src/project/release/ProjectReleaseInspection.ts:5:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| actions | property | `readonly DeploymentRequiredAction[]` | yes |  |
| currentRevision | property | `string` | yes |  |
| desired | property | `ReleaseDesiredState` | yes |  |
| observed | property | `ReleaseObservedState` | yes |  |
| projectRoot | property | `string` | yes |  |

## ProjectReleaseInspectionResult

Kind: `unknown`
Module: `src/project/release/ProjectReleaseInspectionResult.ts`
Source: `src/project/release/ProjectReleaseInspectionResult.ts:4:1`

## ProjectReleaseIosContext

Kind: `type`
Module: `src/project/release/ProjectReleaseIosContext.ts`
Source: `src/project/release/ProjectReleaseIosContext.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| buildProfile | property | `string` | no |  |

## ProjectReleaseWebContext

Kind: `type`
Module: `src/project/release/ProjectReleaseWebContext.ts`
Source: `src/project/release/ProjectReleaseWebContext.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| alias | property | `string` | no |  |
| environment | property | `string` | no |  |

## ProjectStoreListing

Kind: `type`
Module: `src/project/storeListing/ProjectStoreListing.ts`
Source: `src/project/storeListing/ProjectStoreListing.ts:4:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| assetSets | property | `readonly ProjectStoreListingAssetSet[]` | yes |  |
| locales | property | `readonly StoreListingLocale[]` | yes |  |
| revision | property | `string` | yes |  |

## ProjectStoreListingAsset

Kind: `type`
Module: `src/project/storeListing/ProjectStoreListingAsset.ts`
Source: `src/project/storeListing/ProjectStoreListingAsset.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| md5 | property | `string` | yes |  |
| mediaType | property | `StoreListingAssetMediaType` | yes |  |
| relativePath | property | `string` | yes |  |
| sha256 | property | `string` | yes |  |
| size | property | `number` | yes |  |
| sourcePath | property | `string` | yes |  |

## ProjectStoreListingAssetLocation

Kind: `unknown`
Module: `src/project/storeListing/ProjectStoreListingAssetLocation.ts`
Source: `src/project/storeListing/ProjectStoreListingAssetLocation.ts:1:1`

## ProjectStoreListingAssetSet

Kind: `type`
Module: `src/project/storeListing/ProjectStoreListingAssetSet.ts`
Source: `src/project/storeListing/ProjectStoreListingAssetSet.ts:4:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| assets | property | `readonly ProjectStoreListingAsset[]` | yes |  |
| locale | property | `string` | yes |  |
| target | property | `StoreListingTarget` | yes |  |
| variant | property | `string` | yes |  |

## ProjectWebDeploymentAccess

Kind: `type`
Module: `src/project/web/ProjectWebDeploymentAccess.ts`
Source: `src/project/web/ProjectWebDeploymentAccess.ts:4:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |

## ProjectWebDeploymentExecution

Kind: `type`
Module: `src/project/web/ProjectWebDeploymentExecution.ts`
Source: `src/project/web/ProjectWebDeploymentExecution.ts:6:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| execution | property | `DeploymentExecutionResult` | yes |  |
| historyFailure | property | `DeploymentFailure` | no |  |
| historyRecorded | property | `boolean` | yes |  |
| publication | property | `WebDeploymentPublication \| null` | yes |  |
| verification | property | `DeploymentVerificationResult \| null` | yes |  |

## ProjectWebDeploymentInspection

Kind: `type`
Module: `src/project/web/ProjectWebDeploymentInspection.ts`
Source: `src/project/web/ProjectWebDeploymentInspection.ts:7:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| current | property | `DeploymentCurrentState` | yes |  |
| desired | property | `AppDeployManifest` | yes |  |
| desiredRevision | property | `string` | no |  |
| projectRoot | property | `string` | yes |  |
| setup | property | `DeploymentProviderSetupInspectionResult \| null` | yes |  |

## ProjectWebDeploymentInspectionResult

Kind: `unknown`
Module: `src/project/web/ProjectWebDeploymentInspection.ts`
Source: `src/project/web/ProjectWebDeploymentInspection.ts:15:1`

## provider

Kind: `value`
Module: `src/cli/index.ts`
Source: `src/cli/index.ts:10:7`

## readProjectDeploymentConfig

Kind: `function`
Module: `src/project/readProjectDeploymentConfig.ts`
Source: `src/project/readProjectDeploymentConfig.ts:5:1`

### Signatures

- `(options: { readonly projectRoot: string; }) => Promise<AppDeployManifest | null>`
  - options: `{ readonly projectRoot: string; }`
  - returns: `Promise<AppDeployManifest | null>`

## readProjectDeploymentHistory

Kind: `function`
Module: `src/project/readProjectDeploymentHistory.ts`
Source: `src/project/readProjectDeploymentHistory.ts:11:1`

Read one canonical deployment history record from a validated Deploy project.

### Signatures

- `(options: { readonly projectRoot: string; readonly deploymentId: string; }) => Promise<ProjectDeploymentHistoryRecord | null>`
  - options: `{ readonly projectRoot: string; readonly deploymentId: string; }`
  - returns: `Promise<ProjectDeploymentHistoryRecord | null>`

## readProjectMonetization

Kind: `function`
Module: `src/project/monetization/readProjectMonetization.ts`
Source: `src/project/monetization/readProjectMonetization.ts:8:1`

### Signatures

- `(options: { readonly projectRoot: string; }) => Promise<MonetizationDesiredState>`
  - options: `{ readonly projectRoot: string; }`
  - returns: `Promise<MonetizationDesiredState>`

## readProjectRelease

Kind: `function`
Module: `src/project/release/readProjectRelease.ts`
Source: `src/project/release/readProjectRelease.ts:7:1`

### Signatures

- `(options: { readonly projectRoot: string; }) => Promise<ReleaseDesiredState>`
  - options: `{ readonly projectRoot: string; }`
  - returns: `Promise<ReleaseDesiredState>`

## readProjectReleaseHistory

Kind: `function`
Module: `src/project/releaseHistory/readProjectReleaseHistory.ts`
Source: `src/project/releaseHistory/readProjectReleaseHistory.ts:10:1`

### Signatures

- `(options: { readonly projectRoot: string; readonly executionId: string; }) => Promise<ProjectReleaseHistoryRecord | null>`
  - options: `{ readonly projectRoot: string; readonly executionId: string; }`
  - returns: `Promise<ProjectReleaseHistoryRecord | null>`

## readProjectStoreListing

Kind: `function`
Module: `src/project/storeListing/readProjectStoreListing.ts`
Source: `src/project/storeListing/readProjectStoreListing.ts:7:1`

### Signatures

- `(options: { readonly projectRoot: string; }) => Promise<ProjectStoreListing>`
  - options: `{ readonly projectRoot: string; }`
  - returns: `Promise<ProjectStoreListing>`

## recordProjectDeploymentHistory

Kind: `function`
Module: `src/project/recordProjectDeploymentHistory.ts`
Source: `src/project/recordProjectDeploymentHistory.ts:12:1`

Persist one immutable canonical deployment history record for a validated Deploy project.

### Signatures

- `(options: { readonly projectRoot: string; readonly record: ProjectDeploymentHistoryRecord; }) => Promise<void>`
  - options: `{ readonly projectRoot: string; readonly record: ProjectDeploymentHistoryRecord; }`
  - returns: `Promise<void>`

## recordProjectReleaseHistory

Kind: `function`
Module: `src/project/releaseHistory/recordProjectReleaseHistory.ts`
Source: `src/project/releaseHistory/recordProjectReleaseHistory.ts:11:1`

### Signatures

- `(options: { readonly projectRoot: string; readonly record: ProjectReleaseHistoryRecord; }) => Promise<void>`
  - options: `{ readonly projectRoot: string; readonly record: ProjectReleaseHistoryRecord; }`
  - returns: `Promise<void>`

## ReleaseControlExecutionResult

Kind: `unknown`
Module: `src/domain/release/ReleaseControlExecutionResult.ts`
Source: `src/domain/release/ReleaseControlExecutionResult.ts:1:1`

## ReleaseDesiredState

Kind: `type`
Module: `src/domain/release/ReleaseDesiredState.ts`
Source: `src/domain/release/ReleaseDesiredState.ts:5:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| notes | property | `readonly ReleaseNote[]` | yes |  |
| revision | property | `string` | yes |  |
| rollout | property | `ReleaseRollout` | yes |  |
| targets | property | `readonly ReleaseTarget[]` | yes |  |
| version | property | `string` | yes |  |

## ReleaseDiagnostic

Kind: `type`
Module: `src/domain/release/ReleaseDiagnostic.ts`
Source: `src/domain/release/ReleaseDiagnostic.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| code | property | `string` | yes |  |
| message | property | `string` | yes |  |
| severity | property | `"warning" \| "error"` | yes |  |
| target | property | `ReleaseTarget \| "release"` | no |  |

## ReleaseExecutionState

Kind: `type`
Module: `src/domain/release/ReleaseExecutionState.ts`
Source: `src/domain/release/ReleaseExecutionState.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| releaseRevision | property | `string` | yes |  |
| steps | property | `readonly ReleaseExecutionStep[]` | yes |  |

## ReleaseExecutionStep

Kind: `type`
Module: `src/domain/release/ReleaseExecutionStep.ts`
Source: `src/domain/release/ReleaseExecutionStep.ts:5:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| attempts | property | `number` | yes |  |
| code | property | `string` | no |  |
| status | property | `ReleaseExecutionStepStatus` | yes |  |
| step | property | `ReleasePlanStep` | yes |  |

## ReleaseLifecycleControl

Kind: `unknown`
Module: `src/domain/release/ReleaseLifecycleControl.ts`
Source: `src/domain/release/ReleaseLifecycleControl.ts:1:1`

## ReleaseMutationResult

Kind: `unknown`
Module: `src/engine/release/ReleaseMutationResult.ts`
Source: `src/engine/release/ReleaseMutationResult.ts:1:1`

## ReleaseNote

Kind: `type`
Module: `src/domain/release/ReleaseNote.ts`
Source: `src/domain/release/ReleaseNote.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| locale | property | `string` | yes |  |
| text | property | `string` | yes |  |

## ReleaseObservedAndroidState

Kind: `type`
Module: `src/domain/release/ReleaseObservedAndroidState.ts`
Source: `src/domain/release/ReleaseObservedAndroidState.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| artifactRevision | property | `string \| null` | yes |  |
| releaseNotes | property | `readonly ReleaseNote[]` | yes |  |
| rolloutStatus | property | `"draft" \| "completed" \| "missing" \| "inProgress" \| "halted"` | yes |  |
| target | property | `"android"` | yes |  |
| userFraction | property | `string` | no |  |
| version | property | `string \| null` | yes |  |
| versionCodes | property | `readonly string[]` | yes |  |

## ReleaseObservedIosState

Kind: `type`
Module: `src/domain/release/ReleaseObservedIosState.ts`
Source: `src/domain/release/ReleaseObservedIosState.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| appVersionState | property | `string` | no |  |
| artifactRevision | property | `string \| null` | yes |  |
| buildNumber | property | `string \| null` | yes |  |
| phasedReleaseState | property | `"INACTIVE" \| "ACTIVE" \| "PAUSED" \| "COMPLETE" \| null` | yes |  |
| releaseNotes | property | `readonly ReleaseNote[]` | yes |  |
| releaseType | property | `string` | no |  |
| reviewState | property | `string` | no |  |
| target | property | `"ios"` | yes |  |
| version | property | `string \| null` | yes |  |

## ReleaseObservedState

Kind: `type`
Module: `src/domain/release/ReleaseObservedState.ts`
Source: `src/domain/release/ReleaseObservedState.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| targets | property | `readonly ReleaseObservedTargetState[]` | yes |  |

## ReleaseObservedTargetState

Kind: `unknown`
Module: `src/domain/release/ReleaseObservedTargetState.ts`
Source: `src/domain/release/ReleaseObservedTargetState.ts:5:1`

## ReleaseObservedWebState

Kind: `type`
Module: `src/domain/release/ReleaseObservedWebState.ts`
Source: `src/domain/release/ReleaseObservedWebState.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| artifactRevision | property | `string \| null` | yes |  |
| target | property | `"web"` | yes |  |
| version | property | `string \| null` | yes |  |

## ReleasePlan

Kind: `type`
Module: `src/domain/release/ReleasePlan.ts`
Source: `src/domain/release/ReleasePlan.ts:5:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| currentRevision | property | `string` | yes |  |
| desiredRevision | property | `string` | yes |  |
| diagnostics | property | `readonly ReleaseDiagnostic[]` | yes |  |
| status | property | `ReleasePlanStatus` | yes |  |
| steps | property | `readonly ReleasePlanStep[]` | yes |  |

## ReleasePlanStatus

Kind: `unknown`
Module: `src/domain/release/ReleasePlanStatus.ts`
Source: `src/domain/release/ReleasePlanStatus.ts:1:1`

## ReleasePlanStep

Kind: `type`
Module: `src/domain/release/ReleasePlanStep.ts`
Source: `src/domain/release/ReleasePlanStep.ts:5:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| dependsOn | property | `readonly string[]` | yes |  |
| id | property | `string` | yes |  |
| irreversible | property | `boolean` | yes |  |
| operation | property | `ReleaseStepOperation` | yes |  |
| retry | property | `ReleaseStepRetry` | yes |  |
| target | property | `ReleaseTarget \| "release"` | yes |  |

## ReleaseReconcileResult

Kind: `type`
Module: `src/domain/release/ReleaseReconcileResult.ts`
Source: `src/domain/release/ReleaseReconcileResult.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| attemptedStepId | property | `string` | no |  |
| code | property | `string` | no |  |
| currentRevision | property | `string` | yes |  |
| executedStepIds | property | `readonly string[]` | yes |  |
| plan | property | `ReleasePlan` | yes |  |
| status | property | `"completed" \| "blocked" \| "failed" \| "waiting" \| "drifted"` | yes |  |

## ReleaseRollout

Kind: `type`
Module: `src/domain/release/ReleaseRollout.ts`
Source: `src/domain/release/ReleaseRollout.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| android | property | `ReleaseTargetRollout` | no |  |
| ios | property | `ReleaseTargetRollout` | no |  |
| web | property | `ReleaseTargetRollout` | no |  |

## ReleaseRolloutMode

Kind: `unknown`
Module: `src/domain/release/ReleaseRolloutMode.ts`
Source: `src/domain/release/ReleaseRolloutMode.ts:1:1`

## ReleaseStepOperation

Kind: `unknown`
Module: `src/domain/release/ReleaseStepOperation.ts`
Source: `src/domain/release/ReleaseStepOperation.ts:1:1`

## ReleaseStepRetry

Kind: `unknown`
Module: `src/domain/release/ReleaseStepRetry.ts`
Source: `src/domain/release/ReleaseStepRetry.ts:1:1`

## ReleaseTarget

Kind: `unknown`
Module: `src/domain/release/ReleaseTarget.ts`
Source: `src/domain/release/ReleaseTarget.ts:1:1`

## ReleaseTargetRollout

Kind: `type`
Module: `src/domain/release/ReleaseTargetRollout.ts`
Source: `src/domain/release/ReleaseTargetRollout.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| initialFraction | property | `string` | no |  |
| mode | property | `ReleaseRolloutMode` | yes |  |

## removeProjectStoreListingAsset

Kind: `function`
Module: `src/project/storeListing/removeProjectStoreListingAsset.ts`
Source: `src/project/storeListing/removeProjectStoreListingAsset.ts:9:1`

### Signatures

- `(options: { readonly projectRoot: string; readonly location: ProjectStoreListingAssetLocation; }) => Promise<ProjectStoreListing>`
  - options: `{ readonly projectRoot: string; readonly location: ProjectStoreListingAssetLocation; }`
  - returns: `Promise<ProjectStoreListing>`

## removeProjectStoreListingLocale

Kind: `function`
Module: `src/project/storeListing/removeProjectStoreListingLocale.ts`
Source: `src/project/storeListing/removeProjectStoreListingLocale.ts:9:1`

### Signatures

- `(options: { readonly projectRoot: string; readonly locale: string; }) => Promise<ProjectStoreListing>`
  - options: `{ readonly projectRoot: string; readonly locale: string; }`
  - returns: `Promise<ProjectStoreListing>`

## ResolvedDeployProject

Kind: `type`
Module: `src/project/ResolvedDeployProject.ts`
Source: `src/project/ResolvedDeployProject.ts:6:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| deploy | property | `AppDeployManifest \| null` | yes |  |
| manifest | property | `AppManifest` | yes |  |
| manifestPath | property | `string` | yes |  |
| paths | property | `ProjectDeploymentPaths` | yes |  |
| projectRoot | property | `string` | yes |  |

## resolveDeployProject

Kind: `function`
Module: `src/project/resolveDeployProject.ts`
Source: `src/project/resolveDeployProject.ts:6:1`

### Signatures

- `(options: { readonly projectRoot: string; }) => Promise<ResolvedDeployProject>`
  - options: `{ readonly projectRoot: string; }`
  - returns: `Promise<ResolvedDeployProject>`

## resolveProjectDeploymentPaths

Kind: `function`
Module: `src/project/resolveProjectDeploymentPaths.ts`
Source: `src/project/resolveProjectDeploymentPaths.ts:5:1`

### Signatures

- `(projectRoot: string) => ProjectDeploymentPaths`
  - projectRoot: `string`
  - returns: `ProjectDeploymentPaths`

## resumeProjectRelease

Kind: `function`
Module: `src/project/release/resumeProjectRelease.ts`
Source: `src/project/release/resumeProjectRelease.ts:6:1`

### Signatures

- `(options: ResumeProjectReleaseOptions) => Promise<ProjectReleaseExecutionResult>`
  - options: `ResumeProjectReleaseOptions`
  - returns: `Promise<ProjectReleaseExecutionResult>`

## ResumeProjectReleaseOptions

Kind: `type`
Module: `src/project/release/ResumeProjectReleaseOptions.ts`
Source: `src/project/release/ResumeProjectReleaseOptions.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| android | property | `ProjectReleaseAndroidContext` | no |  |
| credentials | property | `readonly DeploymentCredentialReference[]` | no |  |
| executionId | property | `string` | yes |  |
| ios | property | `ProjectReleaseIosContext` | no |  |
| previousExecutionId | property | `string` | yes |  |
| projectRoot | property | `string` | yes |  |
| resolveSecret | property | `DeploymentSecretResolver` | no |  |
| web | property | `ProjectReleaseWebContext` | no |  |

## resumeReleaseExecution

Kind: `function`
Module: `src/engine/release/resumeReleaseExecution.ts`
Source: `src/engine/release/resumeReleaseExecution.ts:21:1`

Resume a release from the exact prior engine state required for safe reconciliation.

### Signatures

- `(options: { readonly desired: ReleaseDesiredState; readonly previous: PreviousReleaseExecution; readonly inspect: InspectRelease; readonly mutate: MutateRelease; }) => Promise<ReleaseReconcileResult>`
  - options: `{ readonly desired: ReleaseDesiredState; readonly previous: PreviousReleaseExecution; readonly inspect: InspectRelease; readonly mutate: MutateRelease; }`
  - returns: `Promise<ReleaseReconcileResult>`

## StoreListingLocale

Kind: `type`
Module: `src/domain/storeListing/StoreListingLocale.ts`
Source: `src/domain/storeListing/StoreListingLocale.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| description | property | `string` | no |  |
| keywords | property | `readonly string[]` | no |  |
| locale | property | `string` | yes |  |
| marketingUrl | property | `string` | no |  |
| name | property | `string` | yes |  |
| privacyPolicyUrl | property | `string` | no |  |
| promotionalText | property | `string` | no |  |
| promoVideoUrl | property | `string` | no |  |
| summary | property | `string` | no |  |
| supportUrl | property | `string` | no |  |

## StoreListingTarget

Kind: `unknown`
Module: `src/domain/storeListing/StoreListingTarget.ts`
Source: `src/domain/storeListing/StoreListingTarget.ts:1:1`

## updateProjectDeploymentConfig

Kind: `function`
Module: `src/project/updateProjectDeploymentConfig.ts`
Source: `src/project/updateProjectDeploymentConfig.ts:10:1`

### Signatures

- `(options: { readonly projectRoot: string; readonly update: ProjectDeploymentConfigUpdater; }) => Promise<AppDeployManifest | null>`
  - options: `{ readonly projectRoot: string; readonly update: ProjectDeploymentConfigUpdater; }`
  - returns: `Promise<AppDeployManifest | null>`

## WebDeploymentPublication

Kind: `type`
Module: `src/domain/WebDeploymentPublication.ts`
Source: `src/domain/WebDeploymentPublication.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| deploymentId | property | `string` | yes |  |
| production | property | `boolean` | yes |  |
| provider | property | `string` | yes |  |
| revision | property | `string` | yes |  |
| target | property | `"web"` | yes |  |
| url | property | `string` | yes |  |

## WebDeploymentPublishIntent

Kind: `type`
Module: `src/domain/WebDeploymentPublishIntent.ts`
Source: `src/domain/WebDeploymentPublishIntent.ts:1:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| alias | property | `string` | no |  |
| environment | property | `string` | no |  |
| mode | property | `"production" \| "preview"` | yes |  |

## writeProjectMonetization

Kind: `function`
Module: `src/project/monetization/writeProjectMonetization.ts`
Source: `src/project/monetization/writeProjectMonetization.ts:8:1`

### Signatures

- `(options: { readonly projectRoot: string; readonly products: readonly MonetizationProduct[]; }) => Promise<MonetizationDesiredState>`
  - options: `{ readonly projectRoot: string; readonly products: readonly MonetizationProduct[]; }`
  - returns: `Promise<MonetizationDesiredState>`

## writeProjectRelease

Kind: `function`
Module: `src/project/release/writeProjectRelease.ts`
Source: `src/project/release/writeProjectRelease.ts:8:1`

### Signatures

- `(options: { readonly projectRoot: string; readonly release: ProjectReleaseInput; }) => Promise<ReleaseDesiredState>`
  - options: `{ readonly projectRoot: string; readonly release: ProjectReleaseInput; }`
  - returns: `Promise<ReleaseDesiredState>`

## writeProjectStoreListingAsset

Kind: `function`
Module: `src/project/storeListing/writeProjectStoreListingAsset.ts`
Source: `src/project/storeListing/writeProjectStoreListingAsset.ts:10:1`

### Signatures

- `(options: { readonly projectRoot: string; readonly location: ProjectStoreListingAssetLocation; readonly data: Uint8Array; }) => Promise<ProjectStoreListing>`
  - options: `{ readonly projectRoot: string; readonly location: ProjectStoreListingAssetLocation; readonly data: Uint8Array; }`
  - returns: `Promise<ProjectStoreListing>`

## writeProjectStoreListingLocale

Kind: `function`
Module: `src/project/storeListing/writeProjectStoreListingLocale.ts`
Source: `src/project/storeListing/writeProjectStoreListingLocale.ts:10:1`

### Signatures

- `(options: { readonly projectRoot: string; readonly locale: StoreListingLocale; }) => Promise<ProjectStoreListing>`
  - options: `{ readonly projectRoot: string; readonly locale: StoreListingLocale; }`
  - returns: `Promise<ProjectStoreListing>`
