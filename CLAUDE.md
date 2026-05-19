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
- `src/app/app.constant.ts` — all string literals and constants
- `src/app/app.utilities.ts` — all generic/reusable methods
- `src/app/backend/` — services and backend logic

## Conventions

### TypeScript class member ordering
1. `private readonly className` — always first
2. All fields (readonly, protected, private), @Input, @Output
3. @ViewChild / @ViewChildren
4. `constructor()` — DI only
5. All methods after constructor — never between fields

### Access modifiers
- Every method and property must have explicit public / protected / private
- Template-only methods must be `protected`, not `public`
- Never use `override` on interface or abstract implementations

### Strings
- Every string literal → named constant in `app.constant.ts`
- Covers: messages, severities, discriminators, sentinels, titles, dialog titles

### Methods
- Check `app.utilities.ts` before writing any new method
- Generic methods (dates, URLs, strings, arrays) go to `app.utilities.ts` first
- JSDoc required on every method — `/** description @param @returns */`

### Dialogs
- Never use `window.confirm` / `window.alert` / `window.prompt`
- Always use `DialogService`
- New dialogs go under `src/app/backend/dialog-service/`
- Components that open dialogs need `@ViewChild('dialogComponentContainer', { read: ViewContainerRef })`

### CSS
- Always include `@media (max-width: 940px)` block in every component CSS file
- All scrollbars use `Utilities.attachScrollAutoHide()` + `.is-scrolling` CSS class
- Scrollbar spec: 8px wide, border-radius 999px, rgba(213,51,105,0.28) accent
- Never use `:hover` to reveal scrollbars

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
- Areas: Entertainment, Home, Nexus, Patch Notes, Login, Recipe, Reminder, Resonance, About, All Pages
- One concise line only — no multi-line body
- After every commit: add entry to the patch notes page in the same session
