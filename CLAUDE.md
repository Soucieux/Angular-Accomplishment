# Accomplishment — Angular Project

> **Coding style skill:** Always read and apply `.claude/skills/coding-style/SKILL.md` before writing any `.ts`, `.html`, or `.css` file. When the user says to record a coding style update, update that file immediately.

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
- `src/app/app.constant.ts` — all string literals and constants
- `src/app/app.utilities.ts` — all generic/reusable methods
- `src/app/backend/` — services and backend logic

## Conventions
All coding style, naming, JSDoc tone, and CSS conventions are in the `coding-style` skill (`.claude/skills/coding-style/SKILL.md`). That skill is the single source of truth — apply it for every `.ts`, `.html`, and `.css` edit.

### New pages
- When adding a new page, update the patch notes page list and `PatchComponent.components` dropdown in the same task

## Hard Rules
- IMPORTANT: Never commit without explicit user instruction.
- IMPORTANT: Never use `window.confirm` / `window.alert` — always DialogService.
- Never include Co-Authored-By in commit messages.
- Never leave screenshot or log files on disk after use.
- Do not self-commit — wait for the user to say "commit".

## Commit Format
- Format: `R1 - <Area> - <Description>`
- Areas: All Pages, Home, Nexus, Resonance, Recipe, Entertainment, Reminder, Debt Sonata, Patch Notes, About, Login
- One concise line only — no multi-line body
- **Maximum 70 characters total (including spaces) — no exceptions**
- After every commit: add entry to the patch notes page in the same session
