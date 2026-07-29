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
- `src/app/common/constants.ts` — all string literals and constants
- `src/app/common/utilities/app.utilities.ts` — all generic/reusable methods
- `src/app/backend/` — services and backend logic

## Conventions
All coding style, naming, JSDoc tone, and CSS conventions are in the `coding-style` skill (`.agents/skills/coding-style/SKILL.md`). Apply it for every `.ts`, `.html`, and `.css` edit.

### New pages
- When adding a new page, update the patch notes page list and `PatchComponent.components` dropdown in the same task

### Documentation
- Whenever a user-visible feature is added, removed, or behaviorally changed, review and update both `README.md` and `README.zh-CN.md` in the same task so they remain synchronized with the code.

## Hard Rules
- IMPORTANT: Never commit without explicit user instruction.
- IMPORTANT: Never use `window.confirm` / `window.alert` — always DialogService.
- Never include Co-Authored-By in commit messages.
- Never leave screenshot or log files on disk after use.
- Do not self-commit — wait for the user to say "commit".
- Work only on changes owned by the current task and repository. Never edit code or seed external records for another session, worktree, or repository.

## Commit Format
- Format: `R2 - <Area> - <Description>`
- Areas: All Pages, Home, Vault, Today, Portal, Reminder, Debt Sonata, Recipe, Entertainment, Resonance, Patch Notes, About, Login, Account
- One concise line only — no multi-line body
- **Maximum 70 characters total (including spaces) — no exceptions**
- After every commit created in the current task and repository, prepare the corresponding patch-note entry in the same session and present its component, element, details, status, and timestamp for user approval.
- Do not write or run the patch-note seeding script until the user approves the exact entry content.
