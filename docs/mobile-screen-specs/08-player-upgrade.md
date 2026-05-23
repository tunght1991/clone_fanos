# Player Upgrade

## Goal

Improve the player experience on mobile and web without changing the existing playback foundation.

## Scope

- Manual chapter navigation
- Auto-advance to the next chapter when playback ends
- Transcript viewing and timestamp seeking
- Bookmark creation with an optional short note
- Responsive layout that stays usable on both mobile and web

## Behavior

- The player keeps the current play/pause, seek, speed, sleep timer, resume, and premium gating flows.
- If a chapter has a transcript, the player shows it and lets the user tap a timed line to jump to that moment.
- The player exposes previous and next chapter actions when a valid playable chapter exists.
- When playback reaches the end of a chapter, the player saves progress and advances to the next playable chapter automatically if one exists.
- Creating a bookmark prompts for an optional note. Saving without a note still creates the bookmark.
- Missing transcript or missing next chapter must not break playback.

## Data Notes

- `AudiobookChapter.transcript` is treated as a lightweight v1 transcript payload.
- `BookmarkCreateRequest.note` is reused for short study notes.
- No backend schema changes are required for this phase.

## Acceptance

- Playback still works on mobile and web.
- Transcript taps seek playback.
- Chapter navigation works manually and on completion.
- Bookmark notes are saved with the bookmark.
- Existing premium and resume behavior stays intact.
