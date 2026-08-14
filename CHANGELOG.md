# @ankhorage/deploy

## 0.10.0

### Minor Changes

- b10e259: Add the first-class `@ankhorage/deploy/cli` provider for category-root `ankh deploy` and `ankh plan deploy`, with dry-run planning, explicit runtime release context, host-owned confirmation, transient ENV credential mapping and offline safety coverage.

## 0.9.0

### Minor Changes

- 5b892ae: Add the complete provider-neutral release lifecycle: canonical `deploy/release.json` authoring,
  cross-target planning, Google Play and App Store rollout execution, read-back verification,
  safe retry/resume, supported lifecycle controls, immutable release history, and intentional
  public release APIs.

  The project entrypoint now owns inspection, planning, execution, resume, and supported lifecycle controls while provider adapters remain internal.

## 0.8.0

### Minor Changes

- 32571a1: Add canonical monetization desired state, Google Play and App Store Connect product synchronization, and the project-level inspect/plan/execute monetization lifecycle.

## 0.7.0

### Minor Changes

- 3f1e427: Add deterministic store listing, localization, and asset synchronization for Google Play and App Store Connect.

## 0.6.0

### Minor Changes

- f3e7b1e: Add iOS deployment planning, EAS build/signing support, and App Store Connect build delivery with verified version attachment.

## 0.5.0

### Minor Changes

- d48cb44: Add first-class Android deployment through EAS Build and Google Play with deterministic revision planning, safe credential handling, transactional publishing, verification, and project-level lifecycle APIs.

## 0.4.0

### Minor Changes

- 8f476cf: Add revision-aware deployment planning and the first production Web deployment lifecycle with Expo export, EAS Hosting publication, verification, and immutable project history.

## 0.3.0

### Minor Changes

- ced9190: Add provider-neutral provisioning, authentication, credential-reference, injected secret-resolution, capability inspection, and safe provider setup orchestration foundations.

## 0.2.0

### Minor Changes

- 94a6a3b: Add the explicit-root Deploy project API, canonical authored deployment paths, safe deployment configuration updates, and immutable deployment history.

## 0.1.0

### Minor Changes

- 7589ba2: Introduce the first public deployment domain API with deterministic target diffing, inspectable plan composition, structured required actions, sequential injected execution, and provider-neutral verification results backed by `@ankhorage/contracts` 7.5.0.

## 0.0.0

- Bootstrap the standalone Ankhorage deployment package repository.
