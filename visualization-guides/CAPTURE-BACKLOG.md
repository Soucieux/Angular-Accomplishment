# Guide Capture Backlog

Outstanding real-application captures. Companion to `GUIDE-CAPTURE-LEDGER.md`, which records
published coverage only — this file records what is still missing.

Every entry is a state that exists in the running application and has no rendered evidence in the
guide. `tools/audit-guide.mjs` cannot detect these: it verifies that every *authored scenario* has
a capture, so a feature with no scenario written passes silently.

**28 gaps across 10 chapters.** Patch Notes, Account, and Messages & Errors are clean.

Ten of the original 38 are closed: the entire Patch Notes chapter is now captured from the running
application — `heatmap-live.jpg` earlier, then its remaining six states on 2026-08-16 — and the
three "reaches Home" claims were satisfied by referencing existing Home evidence (see
[Closed](#closed)).

Capture discipline is unchanged: crop in the image file, no CSS crop metadata, real application
only. Add the scenario and capture entries to `assets/scripts/guide-pages.js` **after** the image
file exists, or the audit will fail on a missing capture path.

🔒 marks a state that requires a signed-in session. Filenames follow each folder's existing
convention — note that `home/` and `debt/` use no `-live` suffix while every other folder does.

---

## Capture method

All seven Patch Notes captures were produced this way, and the same route works for the rest:

- Drive the app with **DOM events via `evaluate`**, not synthetic input. Playwright's `hover` and
  element-screenshot hang here; `evaluate` does not.
- **Never use an element-handle screenshot.** It waits for the element to be "stable" and that wait
  never settles in this app — every such call times out, animations frozen or not. Screenshot the
  page with an explicit `clip` taken from the target's `getBoundingClientRect()` instead.
- **Choose the coordinate space by where the scroll lives.** For content inside the viewport, clip
  in document coordinates (`rect + window.scrollX/Y`) with `fullPage: true`. That fails for anything
  below the fold on a **glass-card page** (Patch Notes, Portal, Today, Recipe, Reminder, Account,
  Vault): the card scrolls internally, so `document.scrollHeight` stays at the viewport height and
  the clip lands outside the image. For those, raise the viewport tall enough to hold the element,
  `scrollIntoView` it, and clip in **viewport** coordinates with `fullPage` off.
- **Freeze animations before capturing**: `*{animation:none!important;transition:none!important}`
  plus `caret-color:transparent`. Also hide `.guide-launcher-button`, which floats over the
  lower-right of any full-width frame.
- **Wait for a settled height, not a first sighting.** The add-row footer reports a height and then
  collapses as the page re-renders; poll until the same non-zero height is seen twice.
- Match the folder's existing width. A 1440-wide viewport at `deviceScaleFactor: 1` yields the
  ~1153px card these folders already use.
- The app's stats take about 8s to arrive here but its retry timer fires at 7s, so a
  **"Connection Lost" dialog appears on a healthy load** and its modal mask blocks interaction.
  Remove `.p-dialog-mask` before driving the page, or the click lands on the mask.
- **Always open the saved file and look at it.** A clip whose element moved between measuring and
  shooting writes a plausible-looking file containing only the page background.

**Where to run the app (verified 2026-08-16).**

- **Public pages now load without a session.** Patch Notes, Resonance, and About render for a
  signed-out visitor, so their non-🔒 states can be captured in a clean browser profile. This was
  not true before 2026-08-16: session recovery treated a visitor with no session as expired,
  redirected every route to login, and tore down the realtime streams. Anything 🔒 still needs a
  real sign-in, and an account that **owns** the records — a non-owner opening the Patch Notes row
  editor gets "User does not have permission" instead of the editor.
- **The deployed site may still redirect** until it is rebuilt with that fix; capture against a
  local `ng serve` rather than `my-own-website-2024.web.app`.
- **`preview_start` could not launch the dev server** in one sandboxed session: the spawned process
  died at Node bootstrap with `EPERM: operation not permitted, uv_cwd` before the CLI ran, while
  `ng version` / `ng build` succeeded from the same shell. The failure is in the spawn environment,
  not `launch.json` or the Angular CLI, so swapping `ng` for `npx` will not help. Run `ng serve`
  from a normal terminal and point the capture tooling at `localhost:4200`.
- **To sign a headless capture run in**, open a visible browser on a dedicated profile directory,
  sign in there by hand, then point the headless run at a copy of that profile. The password stays
  with the operator and the session is reusable across runs.

## Priority

1. **Vault (5)** — now the thinnest chapter relative to its claims.
2. **Home (7) and Resonance (4)** — Home is the landing chapter; Resonance's moderation path is
   documented in prose but never shown.
3. **Entertainment (3), Today (2), Login (2), Portal (1), Recipes (1), Debt (1)** — one or two
   states each.
4. **About (1)** — hover-only emphasis on a static page. Lowest value; skip without loss.
5. **Reminder (1)** — the authored chapter; adding to it means editing the custom walkthrough
   rather than the scenario registry.

---

## Patch Notes — 0 (chapter complete, 2026-08-16)

All six outstanding states were captured from the running application and wired into
`guide-pages.js`: `loading-skeleton-live.jpg`, `release-loading-live.jpg` and
`release-expanded-live.jpg` under `modes`, `empty-search-live.jpg` under `find`, and
`inline-edit-live.jpg` with `add-row-live.jpg` under `manage`. Together with the five that already
existed, the chapter now holds eleven real-app images and the audit passes at 155.

Two of them needed conditions worth remembering: **`inline-edit-live.jpg` requires an account that
owns the records** (a non-owner gets a permission error rather than the row editor), and
**`add-row-live.jpg` only renders on the final page**, where the footer's height must be polled
until it settles. The original table of the six is preserved below for reference.

<details>
<summary>Original gap table (all closed)</summary>

Existing at the time: `heatmap-live.jpg`, `release-story-live.jpg`, `search-live.jpg`,
`sprint-ledger-live.jpg`, `status-filter-live.jpg`. Convention: `<thing>-live.jpg`.

| File to create | State | Setup | Frame |
|---|---|---|---|
| `empty-search-live.jpg` | No-results state (`:206-215`, `PATCH_EMPTY_SEARCH`) | `/patch`, type a query that matches nothing | The table body empty row with the `note_stack` icon and message |
| `loading-skeleton-live.jpg` | Table loading skeleton (`:192-205`) | `/patch` with network throttled in DevTools; capture before rows resolve | The skeleton rows under the real table header |
| `release-loading-live.jpg` | Release-hero skeleton (`:513-553`) | `/patch` → Release notes toggle, throttled | The skeleton hero: badge, title, date, summary lines, section blocks, chips |
| `release-expanded-live.jpg` | Expanded previous release (`:491-506`) | `/patch` → Release notes → click a row under "Previous releases" | The expanded row with its section headings and items |
| 🔒 `inline-edit-live.jpg` | Inline edit mode (`:250-328`) | `/patch`, click the pencil on any row | The row in edit state: details textarea, status dropdown, check + trash buttons |
| 🔒 `add-row-live.jpg` | New-record footer row (`:332-431`) | `/patch`, navigate to the **last** page — the footer only renders when `(t.first ?? 0) + t.rows > t.totalRecords - 1` | The footer row: component select, element input, details textarea, status select, Add button |

Delete confirmation (`:320`) is the shared confirm dialog and is already represented in
Messages & Errors; it does not need a Patch-specific capture unless the chapter documents the
maintenance flow end to end.

</details>

## Vault — 5 🔒

Existing: `locked-live.jpg`, `vault-add-dialog-live.png`, `vault-graph-populated-live.png`,
`vault-list-populated-live.png`. The thinnest chapter in the guide. Convention:
`vault-<thing>-live.png`. All five need the vault unlocked.

| File to create | State | Setup | Frame |
|---|---|---|---|
| `vault-empty-live.png` | Empty vault (`vault.component.html:367-378`) | Unlock a vault with no accounts stored | The empty card: `hub` icon, title, body, and the Add button below it |
| `vault-overview-empty-live.png` | Empty overview strip (`:173-176`, `VAULT_OVERVIEW_EMPTY`) | Unlocked vault where `overviewStats` resolves empty | The overview row showing only its empty message, with surrounding chrome for context |
| `vault-graph-mobile-blocked-live.png` | Graph unavailable on mobile (`:381-387`) | Narrow/touch viewport, Vault graph view | The `blocked-card` with its `desktop_windows` icon and message |
| `vault-edit-category-live.png` | Category editor (`vault.component.ts:825`, `DIALOG_EDIT_VAULT_CATEGORY`) | Unlocked vault, click the edit affordance on an overview category chip | The dialog: name field, icon picker, and the delete action |
| `vault-edit-node-live.png` | Non-account node editor (`vault.component.ts:877`, `DIALOG_EDIT_NON_ACCOUNT`) | Unlocked vault, select a non-account node in Graph, open its edit dialog | The dialog: name, icon, and the backup rows list |

## Home — 7 🔒

Existing: 28 images. Convention: `home-<thing>.png` — **no `-live` suffix in this folder.**

Three panels have a populated capture but no empty one, and none of the four overflow rows is
shown. Read the overflow note below before attempting those four.

| File to create | State | Setup | Frame |
|---|---|---|---|
| `home-entertainment-empty.png` | Entertainment panel empty (`orbital.component.html:263-264`) | Account with no films | The Entertainment panel: header, `0` badge, `ORBITAL_PANEL_EMPTY_GENRES` message |
| `home-recipes-empty.png` | Recipes panel empty (`:294-295`) | Account with no recipes | The Recipes panel with its empty message and `0` badge |
| `home-activity-empty.png` | Activity panel empty (`:326-327`) | Account with no logged activity | The Activity panel with its empty message |
| `home-reminders-overflow.png` | Reminders overflow row (`:156-164`) | ≥20 dated reminders | The bottom of the panel: last rows plus the `open_in_new` overflow row |
| `home-debt-overflow.png` | Debt overflow row (`:238-246`) | ≥20 unpaid debts | The bottom of the panel: last bars plus the overflow row |
| `home-recipes-overflow.png` | Recipes overflow row (`:306-314`) | ≥20 recipes | The bottom of the panel: last rows plus the overflow row |
| `home-shortcuts-overflow.png` | Shortcuts overflow row (`:189-197`) | ≥20 personal (non-shared) links | The bottom of the panel: last links plus the overflow row |

**Overflow-row note.** Reminders, Debt, and Recipes read from stats arrays the writer caps at 20
(`constants.ts:438`, `orbital.component.ts:798`/`:858`), so their `length === 20` test behaves as
"20 or more" and the row appears once the account crosses 20 items. Shortcuts reaches the same
behaviour a different way — its list is uncapped but the test is `>= 20` — so all four overflow rows
now appear at 20 or more items. The note at the end records why that difference is correct and stays.

## Resonance — 4

Existing: `character-limit-focused-live.jpg`, `composer-ready-live.jpg`, `visitor-composer-live.jpg`,
`visitor-ready-live.jpg`, `wall-live.jpg`, `wall-loading-live.jpg`. Convention: `<thing>-live.jpg`.

The guide's `[read]` scenario 0 promises "loading, empty, and populated" but only loading and
populated exist, and the `[moderate]` section illustrates the administrator control with an image
labelled "Standard-reader card controls" — the absence of the control, not the control itself.

| File to create | State | Setup | Frame |
|---|---|---|---|
| `wall-empty-live.jpg` | Empty quote wall (`resonance.component.html:50-54`) | `/resonance` with no quotes stored | The empty state: `format_quote` icon and `RESONANCE_EMPTY_TEXT` |
| 🔒 `moderation-control-live.jpg` | Administrator delete button (`:73-87`) | Signed in as an admin, hover/focus a quote card | One card's meta row: author, relative time, and the visible `pi pi-times` control |
| 🔒 `moderation-confirm-live.jpg` | Delete confirmation (`openDeleteConfirmationDialog`, `:85`) | Admin session, click the delete control | The confirmation dialog over the dimmed wall |
| 🔒 `post-success-live.jpg` | Posted chip (`:34-36`, `RESONANCE_MSG_POSTED`) | Post a quote and capture immediately — the chip is transient | The submit footer: character count, the success chip, and the Post button |

## Entertainment — 3

Existing: 7 images. Convention: `<thing>-live.jpg`. The ledger claimed editing, validation, and
deletion; none had a capture.

| File to create | State | Setup | Frame |
|---|---|---|---|
| 🔒 `edit-dialog-live.jpg` | Edit dialog (`entertainment.component.html:157-171`) | Hover a poster card, click the edit control | The populated edit dialog over the dimmed library |
| ~~`add-validation-live.jpg`~~ | **Retargeted and captured** as `add-required-fields-live.jpg` | — | — |
| 🔒 `delete-confirm-live.jpg` | Delete confirmation (`:196`, `openDeleteConfirmationDialog`) | Hover a poster card, click the red delete control | The confirmation dialog over the dimmed library |

**Two corrections from the 2026-08-16 capture run.**

*The add dialog has no inline validation state.* `add-movie.component.html` disables Search on
`addMovieForm.invalid` (`:100`) and Submit on `!canSubmit` (`:110`), so an invalid submission is
prevented rather than reported and no validation message is ever rendered. The row was retargeted to
`add-required-fields-live.jpg`, which shows that gate, and is **captured and wired**.

*The remaining two need an account that owns the films.* Opening the delete control as a non-owner
returns "User does not have permission" instead of the confirmation dialog, exactly as on Patch
Notes. Note also that film cards only exist after a **genre card is opened** — the page lists genres
first, so `.individual-item` is absent on arrival.

## Today — 2 🔒

Existing: 21 images. Convention: `today-<thing>-live.png`.

| File to create | State | Setup | Frame |
|---|---|---|---|
| `today-reminder-readonly-live.png` | Reminder-sourced item is read-only (`today.component.html:41`, `:251`, `:281`) | A dated reminder that surfaces in Today; hover both its Anytime row and its timed block | Both variants with the `is-reminder` styling and **no** edit/delete controls — those are gated on `TASK_SOURCE_LOCAL` (`:290`, `:353`) |
| `today-source-failure-live.png` | Source-refresh failure message (`[limits]` scenario 0) | Break the reminder source (offline, then refresh Today) | The message surface Today shows when source data cannot refresh |

## Login — 2

Existing: 5 images. Convention: `<thing>-live.jpg`. "Provider differences" was retired from the
ledger — the Google control is one conditional button (`login.component.html:335-343`), not a
separate journey; it is already visible in `sign-in-live.jpg` if that capture was taken in a
browser.

| File to create | State | Setup | Frame |
|---|---|---|---|
| `sign-in-error-live.jpg` | Credential failure dialog (`login.component.ts:603`, `DIALOG_ERROR`) | Sign in with a valid-format but wrong password | The error dialog over the dimmed sign-in form |
| `recovery-complete-live.jpg` | End of the recovery flow | Complete a password reset through to its final screen | The final confirmation step — `forgot-password-live.jpg` shows only the start |

## Portal — 1

Existing: 6 images. Convention: `<thing>-live.jpg`. Note `empty-library-live.jpg` is mislabelled by
expectation — its registry label is "Library loading boundary", so it shows loading, not empty.

| File to create | State | Setup | Frame |
|---|---|---|---|
| `sections-empty-live.jpg` | Both section empties (`portal.component.html:283-287` shared, `:309-317` personal) | A filter or account state where neither section has links | Both sections at once: shared empty message, divider, personal empty message **and** its Add link button |

## Recipes — 1

Existing: 7 images. Convention: `<thing>-live.jpg`.

| File to create | State | Setup | Frame |
|---|---|---|---|
| 🔒 `delete-confirm-live.jpg` | Delete confirmation (`recipe.component.ts:745`, confirm-then-block) | Open a recipe you own, trigger delete | The confirmation dialog; if the blocking overlay is visible behind it, keep it in frame — it is part of the guard |

## Debt Sonata — 1

Existing: 13 images. Convention: `debt-<thing>.png` — **no `-live` suffix in this folder.**

| File to create | State | Setup | Frame |
|---|---|---|---|
| 🔒 `debt-page-empty.png` | Empty Debt page | Account with no debt records | The page's empty state — `debt-create-empty.png` shows the empty *form*, not the empty page |

## About — 1

Existing: 4 images. Lowest value in the backlog; the ledger claim has been corrected, so skipping
this leaves nothing inaccurate.

| File to create | State | Setup | Frame |
|---|---|---|---|
| `about-milestone-hover-live.jpg` | Hover-only emphasis | Hover one milestone entry | The emphasized entry beside an un-emphasized neighbour, so the difference is readable |

## Reminder — 1

The authored chapter. Adding here means editing the custom walkthrough, not the scenario registry,
so treat it as a separate task from the other twelve.

| File to create | State | Setup | Frame |
|---|---|---|---|
| 🔒 `recovery-live.jpg` | Failure/recovery during a reminder write | Trigger a write while offline | The recovery surface in Reminder's own context |

---

## Closed

| Chapter | Gap | How it was closed |
|---|---|---|
| Patch Notes | Heatmap meaning | `patch/heatmap-live.jpg` captured from the running app and wired into the `signals` section |
| Patch Notes | All six remaining states | Captured 2026-08-16 from the running app and wired into `modes`, `find`, and `manage` — the chapter is now complete |
| Entertainment | A film reaches Home | References `home/home-entertainment-populated.png` from the `manage` section |
| Recipes | A recipe reaches Home | References `home/home-recipes-populated.png` from the `browse` section |
| Debt Sonata | A debt reaches Home | References `home/home-debt-populated.png` from the `summary` section |

Reusing an image across chapters is established practice — Messages & Errors sources all five of its
captures from other chapters' folders. The three Home references needed no new photography.

**Wiring order matters.** The audit rejects any stored image that no scenario references, so a new
file must be added to `guide-pages.js` in the same change that puts it on disk. Sections with a
single scenario accept a capture with no `scenario` key; multi-scenario sections require an explicit
index.

---

## Defect found while specifying — FIXED (capture now unblocked)

**Was: the Home shortcuts overflow row was unreachable above 20 links.**
`shortcutLinks` is assigned uncapped at `orbital.component.ts:557`
(`this.links.filter((link) => !link.isShared)`), while the template tested
`shortcutLinks.length === 20`. The sibling panels read from stats arrays the writer caps at 20, so
their identical `=== 20` test means "20 or more". Shortcuts had no such cap, so the "open Portal"
row appeared at exactly 20 personal links and vanished again at 21.

**Fixed** in `R2 - Home - Fix shortcuts overflow row and its label typo` — the test is now
`shortcutLinks.length >= 20` (`orbital.component.html:189`). The row appears at 20 links and stays
for every count above it, so `home-shortcuts-overflow.png` no longer needs an account trimmed to
exactly 20 — any account with 20 or more personal links will do.

**Reviewed and closed — no cap is owed here (2026-08-16).** `shortcutLinks` stays uncapped. The
siblings' 20 is a storage limit, not a display rule: `constants.ts:530` caps the stats arrays "on
every write" to keep the stats document small, and notes that "counters are always the uncapped true
total" — which is why those panels each need a separate count field (`orbital.component.ts:562`) to
report a number their own array cannot supply. Shortcuts is fed from `@Input() links`, the full
Portal array, so it was never subject to that constraint and its badge at
`orbital.component.html:177` is already the true count. Capping it would trade a truthful badge and a
scrollable full list for symmetry with a limit that exists for a reason Shortcuts does not share.
The two overflow tests differ for the same reason: `=== 20` detects truncation, `>= 20` cannot,
because this list is never truncated. Capturing the overflow row does not depend on any of this.
