# Guide Capture Backlog

Outstanding real-application captures. Companion to `GUIDE-CAPTURE-LEDGER.md`, which records
published coverage only — this file records what is still missing.

Every entry is a state that exists in the running application and has no rendered evidence in the
guide. `tools/audit-guide.mjs` cannot detect these: it verifies that every *authored scenario* has
a capture, so a feature with no scenario written passes silently.

**34 gaps across 11 chapters.** Account and Messages & Errors are clean.

Four of the original 38 are closed: `patch/heatmap-live.jpg` was captured from the running
application, and the three "reaches Home" claims were satisfied by referencing existing Home
evidence (see [Closed](#closed)).

Capture discipline is unchanged: crop in the image file, no CSS crop metadata, real application
only. Add the scenario and capture entries to `assets/scripts/guide-pages.js` **after** the image
file exists, or the audit will fail on a missing capture path.

🔒 marks a state that requires a signed-in session. Filenames follow each folder's existing
convention — note that `home/` and `debt/` use no `-live` suffix while every other folder does.

---

## Capture method

`patch/heatmap-live.jpg` was produced this way, and the same route works for the rest:

- Drive the app with **DOM events via `evaluate`**, not synthetic input. Playwright's `hover`,
  element-screenshot, and `page.screenshot` all hang in this environment; `evaluate` and raw CDP
  do not.
- Capture with **CDP `Page.captureScreenshot` and an explicit `clip`** taken from the target's
  `getBoundingClientRect()`. That is what produces a cropped image rather than a full page.
- Keep each call short. A call that overruns resets the page to `about:blank`, costing the
  reload.
- The app's stats take about 8s to arrive here but its retry timer fires at 7s, so a
  **"Connection Lost" dialog appears on a healthy load** and its modal mask blocks interaction.
  Remove `.p-dialog-mask` before driving the page, or the click lands on the mask.

## Priority

1. **Patch Notes (6) and Vault (5)** — the two thinnest chapters relative to their claims.
2. **Home (7) and Resonance (4)** — Home is the landing chapter; Resonance's moderation path is
   documented in prose but never shown.
3. **Entertainment (3), Today (2), Login (2), Portal (1), Recipes (1), Debt (1)** — one or two
   states each.
4. **About (1)** — hover-only emphasis on a static page. Lowest value; skip without loss.
5. **Reminder (1)** — the authored chapter; adding to it means editing the custom walkthrough
   rather than the scenario registry.

---

## Patch Notes — 6

Existing: `heatmap-live.jpg`, `release-story-live.jpg`, `search-live.jpg`, `sprint-ledger-live.jpg`,
`status-filter-live.jpg`. Convention: `<thing>-live.jpg`.

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
| `home-shortcuts-overflow.png` | Shortcuts overflow row (`:189-197`) | **Exactly 20** personal links — see the defect note | The bottom of the panel: last links plus the overflow row |

**Overflow-row note.** Reminders, Debt, and Recipes read from stats arrays the writer caps at 20
(`constants.ts:438`, `orbital.component.ts:798`/`:858`), so their `length === 20` test behaves as
"20 or more" and the row appears once the account crosses 20 items. Shortcuts does not — see below.

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
| 🔒 `add-validation-live.jpg` | Add-dialog validation | Open the add dialog, submit with a required field empty | The dialog with its inline validation message visible |
| 🔒 `delete-confirm-live.jpg` | Delete confirmation (`:196`, `openDeleteConfirmationDialog`) | Hover a poster card, click the red delete control | The confirmation dialog over the dimmed library |

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

## Defect found while specifying

**The Home shortcuts overflow row is unreachable above 20 links.**
`shortcutLinks` is assigned uncapped at `orbital.component.ts:557`
(`this.links.filter((link) => !link.isShared)`), but the template tests
`shortcutLinks.length === 20` (`orbital.component.html:189`). The sibling panels read from stats
arrays the writer caps at 20, so their identical `=== 20` test means "20 or more". Shortcuts has no
such cap, so the "open Portal" row appears at exactly 20 personal links and disappears again at 21,
after which all 21+ rows render inside the panel with no overflow affordance.

This is a product defect, not a documentation gap. Capturing `home-shortcuts-overflow.png` requires
trimming to exactly 20 links, which is why it sits last in the Home table. Worth fixing at the
source — `>= 20`, or a `.slice(0, 20)` to match the sibling panels — before capturing it.
