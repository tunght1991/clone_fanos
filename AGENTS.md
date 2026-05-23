# AGENTS.md

- Prefer reading only files directly related to the task.
- Do not scan the whole repository unless asked.
- Before editing, explain which files you will inspect.
- Ignore node_modules, dist, build, coverage.
- Run only targeted tests first.

## Design System Source of Truth

Before making any UI, styling, layout, typography, spacing, animation,
or component changes, read and follow `DESIGN.md`.

`DESIGN.md` is the canonical source for:
- colors
- typography
- spacing
- border radius
- shadows
- component variants
- visual hierarchy
- interaction patterns

Rules:
- Prefer existing design tokens from `DESIGN.md`
- Do not introduce new colors, spacing scales, or component styles unless necessary
- Reuse existing component patterns before creating new ones
- If a missing token or rule is required:
  1. add it to `DESIGN.md`
  2. explain why in the final summary

When implementing UI:
- keep visual consistency with `DESIGN.md`
- avoid arbitrary Tailwind values when a token exists
- prefer semantic component APIs over one-off styling
- preserve accessibility and responsive behavior

If there is conflict between inline styling and `DESIGN.md`,
follow `DESIGN.md` unless explicitly instructed otherwise.