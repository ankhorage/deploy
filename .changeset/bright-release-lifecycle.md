---
'@ankhorage/deploy': minor
---

Add the complete provider-neutral release lifecycle: canonical `deploy/release.json` authoring,
cross-target planning, Google Play and App Store rollout execution, read-back verification,
safe retry/resume, supported lifecycle controls, immutable release history, and intentional
public release APIs.

The project entrypoint now owns inspection, planning, execution, resume, and supported lifecycle controls while provider adapters remain internal.
