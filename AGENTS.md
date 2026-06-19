# AGENTS.md

## Core Working Principles

You are working inside an existing codebase. Act carefully, inspect narrowly, and avoid unnecessary changes.

### Repository Inspection Rules

* Prefer reading only files directly related to the current task.
* Do not scan the entire repository unless explicitly asked.
* Do not open, search, or analyze unrelated folders.
* Before editing any file, explain briefly:

  * which files you plan to inspect
  * why those files are relevant
  * which files you expect to modify, if known

### Ignored Directories

Never inspect, modify, or search inside these directories unless explicitly instructed:

* `node_modules`
* `dist`
* `build`
* `coverage`
* `.next`
* `.nuxt`
* `.turbo`
* `.cache`
* `vendor`

## Change Discipline

* Make the smallest safe change that solves the task.
* Avoid refactoring unrelated code.
* Preserve existing architecture, naming conventions, and file structure.
* Prefer existing utilities, hooks, components, and patterns before introducing new ones.
* Do not introduce new dependencies unless clearly necessary.
* If a new dependency is necessary, explain why and mention the tradeoff in the final summary.
* Do not silently change public APIs, component props, environment variables, routing behavior, or data contracts.
* If a requested change may affect other parts of the system, call that out before editing.

## Testing Strategy

* Run only targeted tests first.
* Prefer the smallest relevant test command for the files or feature being changed.
* Do not run the full test suite unless:

  * targeted tests pass and broader validation is needed
  * the user explicitly asks
  * the change touches shared logic, global configuration, routing, authentication, or design-system primitives
* If tests cannot be run, explain why and describe what should be tested manually.

## Design System Source of Truth

Before making any UI, styling, layout, typography, spacing, animation, or component changes, read and follow `DESIGN.md`.

`DESIGN.md` is the canonical source of truth for:

* colors
* typography
* spacing
* border radius
* shadows
* component variants
* visual hierarchy
* interaction patterns
* responsive behavior
* accessibility expectations

## Design System Rules

When implementing UI:

* Prefer existing design tokens from `DESIGN.md`.
* Reuse existing component patterns before creating new components.
* Do not introduce new colors, spacing scales, typography rules, shadows, animations, or component variants unless necessary.
* Avoid arbitrary Tailwind values when an existing token or pattern is available.
* Prefer semantic component APIs over one-off styling.
* Preserve accessibility, keyboard behavior, focus states, and responsive behavior.
* Keep visual hierarchy consistent with existing screens.
* Match the tone, density, spacing, and interaction style already defined in `DESIGN.md`.

## Missing Design Tokens or Rules

If a required design token, style rule, or component variant does not exist:

1. Add the missing rule to `DESIGN.md`.
2. Use the new rule consistently in the implementation.
3. Explain in the final summary:

   * what was added
   * why it was necessary
   * where it was used

Do not create ad-hoc UI styles without updating `DESIGN.md` when the style should become reusable.

## Conflict Resolution

If there is a conflict between inline code, existing local styling, and `DESIGN.md`:

* Follow `DESIGN.md` by default.
* Preserve existing behavior unless the task explicitly asks for a visual/design correction.
* If the user explicitly instructs something that conflicts with `DESIGN.md`, follow the user’s instruction and mention the conflict in the final summary.

## Editing Workflow

Before editing:

1. Identify the smallest relevant set of files.
2. Read those files.
3. Read `DESIGN.md` if the task involves UI, styling, layout, typography, spacing, animation, or components.
4. Explain the intended edit scope.
5. Make focused changes only.

After editing:

1. Run targeted tests or checks where possible.
2. Summarize changed files.
3. Explain what was changed and why.
4. Mention any tests run.
5. Mention any tests not run and why.
6. Call out any risks, assumptions, or follow-up work.

## Final Response Format

Use this structure in the final summary:

```md
## Summary
- ...

## Files Changed
- `path/to/file`: ...

## Validation
- Ran: ...
- Not run: ...

## Notes
- ...
```

Keep the final summary concise, factual, and specific.
