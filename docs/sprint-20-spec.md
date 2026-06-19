# Sprint 20 Spec: Retention Loop v1

## Overview

Sprint 20 adds a small retention loop to the mobile Home screen:
- a weekly habit summary built from recent listening and engagement activity
- a ranked list of recommended next audiobooks

The goal is to help a returning user see progress quickly and jump back into the next best title without changing the existing browse/search/player flows.

## Goals

- Give Home a retention-oriented surface that is still read-only and deterministic.
- Reuse existing activity data from playback, bookmarks, favorites, and notes.
- Keep the mobile UI additive so the current MVP experience stays intact.
- Add analytics for retention impressions and taps so the loop can be measured.

## Non-Goals

- No machine learning recommendation system.
- No push notification system.
- No offline download or sync work.
- No new write APIs.

## Scope

### Backend

- Add `GET /retention/home`.
- Compute a weekly summary from recent playback and engagement data.
- Rank a small set of recommendation candidates using rule-based heuristics.

### Mobile

- Load retention data together with the browse feed on Home.
- Render a weekly habit summary card.
- Render recommended next cards with tap-through to audiobook detail.
- Keep empty and loading states graceful.

### Analytics

- Track Home retention impressions.
- Track recommendation taps.

## Acceptance Criteria

- Home shows the weekly habit summary when the endpoint returns data.
- Home shows recommended next titles when candidates exist.
- Tapping a recommendation opens the audiobook detail screen.
- Existing browse/search/detail/player flows continue to work unchanged.
- The new endpoint returns a stable `data` + `meta` response shape.

## References

- `docs/api-design.md`
- `docs/mobile-screen-specs/02-home-browse.md`
- `apps/api/src/modules/retention/*`
- `apps/mobile/lib/features/retention/*`
