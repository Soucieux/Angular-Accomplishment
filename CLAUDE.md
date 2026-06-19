# Accomplishment — Angular Project

## Stack
- Angular (latest), TypeScript strict
- PrimeNG for UI components
- DialogService for all dialogs
- Playwright for browser automation

## Commands
- `ng serve` — development server
- `ng build` — production build
- `ng test` — unit tests

## Architecture
- `src/app/backend/dialog-service/` — all dialog components live here
- `src/app/common/app.constant.ts` — all string literals and constants
- `src/app/common/utilities/app.utilities.ts` — all generic/reusable methods
- `src/app/backend/` — services and backend logic

## Conventions
All coding style, naming, JSDoc tone, and CSS conventions are in the `coding-style` skill (`.claude/skills/coding-style/SKILL.md`). Apply it for every `.ts`, `.html`, and `.css` edit.

### New pages
- When adding a new page, update the patch notes page list and `PatchComponent.components` dropdown in the same task

## Hard Rules
- IMPORTANT: Never commit without explicit user instruction.
- IMPORTANT: Never use `window.confirm` / `window.alert` — always DialogService.
- Never include Co-Authored-By in commit messages.
- Never leave screenshot or log files on disk after use.
- Do not self-commit — wait for the user to say "commit".

## Commit Format
- Format: `R2 - <Area> - <Description>`
- Areas: All Pages, Home, Nexus, Resonance, Recipe, Entertainment, Reminder, Debt Sonata, Patch Notes, About, Login, Account
- One concise line only — no multi-line body
- **Maximum 70 characters total (including spaces) — no exceptions**
- After every commit: add entry to the patch notes page in the same session

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
