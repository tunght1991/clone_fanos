# Implementation Plan: Sprint 20 Retention Loop v1

## Overview

Build one vertical slice of retention value: backend read model, mobile Home rendering, and basic analytics.

## Architecture Decisions

- Keep recommendations deterministic and rule-based so the feature ships without new infrastructure.
- Add a dedicated retention repository on mobile rather than overloading discovery or playback data access.
- Keep the endpoint read-only and bounded to a 7-day window to keep the Home experience fast and predictable.

## Task List

### Phase 1: Backend Contract
- [x] Task 1: Add `GET /retention/home` with DTOs for weekly summary and recommendations.
- [x] Task 2: Reuse playback, bookmark, favorite, and note data to build the summary and candidate ranking.
- [x] Task 3: Add backend smoke coverage and service-level tests for the new response shape.

### Checkpoint: Backend Contract
- [x] API contract is stable and returns deterministic data for seeded activity.
- [x] Smoke tests cover the new endpoint without breaking the existing auth/content/playback flow.

### Phase 2: Mobile Home Surface
- [x] Task 4: Add a retention repository and connect Home to load browse + retention data together.
- [x] Task 5: Render weekly summary and recommended next cards on Home.
- [x] Task 6: Track retention impression and recommendation tap analytics.

### Checkpoint: Mobile Surface
- [x] Home still supports browse/search/detail navigation.
- [x] Retention sections render from the mock repository and basic tap-through works.

### Phase 3: Docs and Verification
- [x] Task 7: Update `docs/api-design.md` and `docs/mobile-screen-specs/02-home-browse.md`.
- [x] Task 8: Add Sprint 20 spec and implementation plan docs.
- [x] Task 9: Run targeted API and mobile tests and fix any regressions.

### Checkpoint: Complete
- [x] All targeted tests pass.
- [x] Working tree is clean and ready for review or commit.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Recommendation logic returns empty state too often | Medium | Keep a simple fallback ranking based on recent activity and author affinity. |
| Home load time increases because two datasets are fetched | Medium | Keep the retention response small and fetch only once per Home load. |
| UI becomes noisy on smaller screens | Low | Reuse existing card patterns and fall back to empty states when needed. |

## Open Questions

- Should Sprint 21 extend the same retention read model to notifications, or keep notifications separate?
