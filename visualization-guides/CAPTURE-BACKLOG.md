# Guide Capture Backlog

Outstanding real-application captures. Companion to `GUIDE-CAPTURE-LEDGER.md`, which records
published coverage only — this file records what is still missing.

Every entry is a state that exists in the running application and has no rendered evidence in the
guide. `tools/audit-guide.mjs` cannot detect these: it verifies that every *authored scenario* has
a capture, so a feature with no scenario written passes silently.

**2 gaps remain, in 2 chapters, and neither is waiting on capture technique.** Vault's
`vault-overview-empty-live.png` documents a branch the application can never reach and needs a code
decision; Login's `recovery-complete-live.jpg` needs an emailed verification code only the account
owner receives. Every other chapter is clean.

Twenty-eight of the original 38 are closed and one was retired as invalid. The 2026-08-21 run closed
thirteen at once: all seven Home panel rows, Today's read-only reminder, Portal's resolved-empty
sections, Resonance's empty wall, Debt Sonata's empty ledger, Entertainment's card edit, and
Reminder's write-failure dialog. See [Closed](#closed).

**Check the folder and the registry before treating any row here as open.** Four rows in this file
were found already captured, wired, and committed — `vault-empty-live.png`, `moderation-confirm-live.jpg`,
`entertainment/delete-confirm-live.jpg`, and `recipe/delete-confirm-live.jpg`. Two of them were
overwritten by a re-capture before the staleness was noticed and had to be restored from `HEAD`.
This file is a to-do list, not a record of state.

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

**Screenshot timeouts on signed-in pages (found 2026-08-20).** `browser_take_screenshot` has a
fixed 5-second ceiling and fails with `Timeout 5000ms exceeded` after logging "fonts loaded". Two
distinct causes, with different symptoms — measure `requestAnimationFrame` cadence to tell them
apart (30 frames, report the median delta):

- **~1000ms per frame → the tab is throttled.** Chrome throttles a backgrounded or occluded tab to
  1fps, and the screenshot cannot get a fresh frame. `document.visibilityState` still reports
  `visible` and `hasFocus()` still returns true, so neither is a reliable check — the rAF cadence is.
  Fix: `browser_tabs` with `action: 'select'` to bring the page to the front, then shoot. Verified:
  About failed three times in a row, then succeeded immediately after a tab select. This appears once
  the operator signs in by hand, because their own window ends up in front of the automated one.
- **~8ms per frame → the page is painting at full speed but the shot still times out.** Seen on
  Resonance while signed in. **Resolved 2026-08-20: it is contention for the foreground, not the
  page.** A tab select, clearing every `setInterval`/`setTimeout` id, neutralising
  `requestAnimationFrame`, freezing CSS animations, dropping the viewport to 700px tall, and encoding
  as JPEG instead of PNG all failed while the operator was using the machine. With the machine left
  untouched for the duration of the run, the identical page captured on the **first attempt**, three
  times consecutively (`moderation-control`, `moderation-confirm`, `post-success`). **The fix is
  procedural: agree an uninterrupted window, then do not touch the mouse, keyboard, or window focus
  until the run reports done.** Nothing about the page needs changing.

  **`backdrop-filter` was tested and ruled out (2026-08-20).** Resonance carries three blurred
  layers (`mat-drawer` at `blur(50px)`, `.submit-card` at `blur(40px) saturate(1.6)`, and the guide
  launcher). Disabling all of them made two screenshots succeed, and disabling only `.submit-card`
  made a third succeed, which looked like a clean isolation — but the identical configuration then
  failed four times in a row, and a fresh blanket `backdrop-filter: none` failed as well. **The two
  successes were coincidence, not causation.** Do not re-run this experiment expecting a fix.

  What the evidence actually supports is that the failure is **intermittent and unrelated to page
  content** — the same DOM, same styles, and same rAF cadence produce a success or a timeout on
  different attempts. The most likely remaining explanation is the automated window losing foreground
  to the operator's own window, since the 5s ceiling leaves no margin once the compositor stalls.
  Practical advice: retry `tabs select` → screenshot several times rather than changing the page, and
  leave the machine untouched while a signed-in capture run is in progress.

**CSS `:hover` cannot be reached with synthetic events.** Dispatching `mouseenter`/`mouseover` via
`evaluate` runs the Angular handler but leaves `:hover` unmatched, so a control revealed only by CSS
stays at `opacity: 0` and the capture shows an empty slot. This is what invalidated the first attempt
at `moderation-control-live.jpg`. Playwright's own `hover` hangs here (see above), so the working
route is to inject **exactly the declaration from the component's own `:hover` rule** and nothing
else — for the Resonance delete control that is `opacity: 1`, copied from
`resonance.component.css:536-538`. Read the rule first and reproduce every property it sets, or the
capture will differ from the real hover state.

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

Neither open row is capture work.

1. **Vault (1)** — blocked on an application decision. Either delete the unreachable branch or make
   `overviewStats` skip the `Uncategorized` bucket so the message can appear as its text intends.
   Until one of those happens there is nothing to photograph.
2. **Login (1)** — blocked on the account owner, who must receive the emailed recovery code and
   drive the flow to its final screen.

**Forcing an unreachable state in code is an accepted route, with two conditions.** The 2026-08-21
run produced nine captures by temporarily emptying a data source or lowering an overflow threshold,
then reverting with `git restore src/`. Start from a clean tree so the revert is total, and never
force a *partial* state: zeroing `genreBars` alone produced a panel reading "badge 79 / No genre
data yet", which is a screen the application cannot draw. Zero the counts the panel derives from as
well, or the capture is fiction.

**Test data must be removed in the same session.** Every record created for a capture — reminders,
debts, links, a recipe, a film — was deleted afterwards and each list re-read to confirm. Deleting
reminders also decrements `totalReminders`, which can be driven negative; correct it with
`updateUserStatCount('totalReminders', +1)` rather than `seedUserStats()`, which would zero the
completion counters and restamp the account creation date.

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

## Vault — 1 🔒

Existing: 7 images — `locked-live.jpg`, `vault-add-dialog-live.png`, `vault-empty-live.png`,
`vault-graph-populated-live.png`, `vault-list-populated-live.png`, `vault-edit-node-live.png`,
`vault-edit-category-live.png`. Convention: `vault-<thing>-live.png`. The one remaining row needs
the vault unlocked, but that is not what blocks it.

(`vault-empty-live.png` was listed here as outstanding until 2026-08-20; it had in fact already been
captured, wired, and committed — 720×380, one reference in `guide-pages.js`. Check the folder and
the registry before assuming a row is still open.)

| File to create | State | Setup | Frame |
|---|---|---|---|
| `vault-overview-empty-live.png` | Empty overview strip (`:173-176`, `VAULT_OVERVIEW_EMPTY`) | **Unreachable — see below** | — |

**`vault-overview-empty` cannot be produced, and the branch behind it is dead code (2026-08-20).**
Three states were tested directly on an unlocked vault:

| Vault contents | What renders |
|---|---|
| No nodes at all | The empty **card** (`:367-378`) — the overview strip is not in the DOM |
| One account with no categories | The overview strip carrying an **Uncategorized** chip |
| One non-account node, no accounts | The empty **card** again — the strip needs an account, not just a node |

`overviewStats` (`vault.component.ts:1453`) files an uncategorised account into the `Uncategorized`
bucket rather than skipping it, so any account guarantees at least one chip, and the strip only
renders when an account exists. `overviewStats.length === 0` inside that block is therefore never
true and `VAULT_OVERVIEW_EMPTY` ("No categorized accounts yet") can never display. **This is an
application finding, not a capture problem** — either the branch should be removed, or
`overviewStats` should omit the Uncategorized bucket so the message can appear as its text intends.
Do not attempt this capture until that is decided.

**`vault-graph-mobile-blocked` was dropped by the repository owner (2026-08-20)**, not missed. The
state is real and was captured successfully — the card renders once `utilities.isMobile()` is true,
which needs `(max-width: 900px) and (pointer: coarse)` — but the owner does not want a
narrow-viewport capture in the guide. The file was deleted and the row closed. Do not re-open it.

**Two rows closed on 2026-08-20** — `vault-edit-node-live.png` and `vault-edit-category-live.png`;
see [Closed](#closed) for the route used.

## Home — 0 (chapter complete, 2026-08-21)

Existing: 35 images. Convention: `home-<thing>.png` — **no `-live` suffix in this folder.**

All seven rows closed on 2026-08-21. Three empty panels (Entertainment, Recipes, Activity) and all
four overflow rows are now captured and wired into the `panels` group.

**How the empties were produced.** Entertainment and Recipes read live counts, so emptying only the
list left an incoherent panel — a `79` badge above "No genre data yet". `totalFilms` and
`totalRecipes` were zeroed alongside the list data so each capture shows a state the application
could actually reach.

**How the overflow rows were produced.** The four thresholds were lowered from `20` to `>= 1` in
`orbital.component.html` (`:156`, `:189`, `:238`, `:306`) so the route-out row rendered against a
handful of real records instead of requiring an account with 20+ items in each panel. The row's
appearance is threshold-driven and its rendering is identical either way, so the capture is honest;
building four 20-item data sets would have changed nothing visible. All edits were reverted.

**One thing the captures document that the backlog did not predict.** The route-out row is not
merely capped-list overflow — it is absent entirely from the empty panels. `home-recipes-empty.png`
and `home-entertainment-empty.png` show the count and message with no route out, so the control
appears only once the panel has content.

## Resonance — 0 (chapter complete, 2026-08-21)

Existing: 11 images. Convention: `<thing>-live.jpg`.

`wall-empty-live.jpg` was captured on 2026-08-21 by forcing `quotes$` to `of([])` in
`resonance.component.ts` (`:131`, `:141`) and reverting afterwards. Quotes are global rather than
per-account, so an empty wall cannot otherwise be reached without deleting real content that belongs
to other people; the forced branch is the genuine empty template, not a mock.

**Two rows closed on 2026-08-20**, and a third was never open:
- `moderation-control-live.jpg` — captured. The control is CSS-hover-revealed; see the synthetic-event
  note in [Capture method](#capture-method) for why the first attempt failed and how to force it.
- `post-success-live.jpg` — captured. The chip is transient; the working method is to post normally,
  then `clearTimeout` the component's `postSuccessTimer` so the real rendered chip persists for the
  shot. The quote created for it was deleted afterwards through the admin control.
- `moderation-confirm-live.jpg` — **was already captured, wired, and committed** in `209802d6`; it was
  listed here in error, the same staleness as `vault-empty-live.png`.

## Entertainment — 0 (chapter complete, 2026-08-21)

Existing: 11 images. Convention: `<thing>-live.jpg`.

| Row | Outcome |
|---|---|
| ~~`edit-dialog-live.jpg`~~ | **Retargeted and captured** as `edit-inline-live.jpg` — see below |
| ~~`add-validation-live.jpg`~~ | **Retargeted and captured** as `add-required-fields-live.jpg` |
| ~~`delete-confirm-live.jpg`~~ | **Was already captured, wired, and committed** in `209802d6`; the row was stale |

**There is no edit dialog.** The row asked for "the populated edit dialog over the dimmed library",
but `startEdit` toggles *inline* edit mode on the card itself: Genre becomes a dropdown, the card
actions become confirm and cancel, and the card never leaves the grid. Nothing opens over the
library. The capture was saved under the name the state actually has.

**The add dialog has no inline validation state either.** `add-movie.component.html` disables Search
on `addMovieForm.invalid` (`:100`) and Submit on `!canSubmit` (`:110`), so an invalid submission is
prevented rather than reported and no validation message is ever rendered.

**Two notes for anyone capturing here again.** Film cards only exist after a **genre card is
opened** — the page lists genres first, so `.individual-item` is absent on arrival. And a film whose
genre write fails is created anyway: it lands in no genre bucket, so it is invisible on the page and
cannot be deleted through the UI. Set the genre by clicking the `p-select` option, never by writing
a bare string to the FormControl — the control binds `{genre, label}`, not the value.

## Today — 0 (chapter complete, 2026-08-21)

Existing: 22 images. Convention: `today-<thing>-live.png`.

`today-reminder-readonly-live.png` was captured on 2026-08-21 and shows **both** variants in one
frame: the padlocked Anytime chip and the timed block carrying the `REMINDER · read-only` tag, with
no edit or delete controls in either.

**`today-source-failure-live.png` was retired, not captured — the state does not exist.** The row
asked for "the message surface Today shows when source data cannot refresh". There is no such
surface: `refreshReminderSub` (`today.component.ts:927`) subscribes with no error callback, and the
only availability branch in `today.component.html` is `@if (isMobile)` at line 1, already captured
as `today-unsupported-width-live.png`. A failed reminder stream leaves the board rendered and one
item short — indistinguishable from a board that never had the item. The `[limits]` section's own
copy already states this correctly ("can leave the Today board visible without the expected source
item"), so the row was the thing that was wrong. Do not re-open it.

**Capture note.** A reminder will not surface in Today until `refreshReminderSub()` has run *after*
auth resolves — it bails early when `getUserId()` is empty. Re-invoke it rather than reloading.
Storage is also date-shifted: passing `2026-08-21` stored `2026-08-20`, so compensate by one day.

## Login — 1

Existing: 6 images. Convention: `<thing>-live.jpg`. "Provider differences" was retired from the
ledger — the Google control is one conditional button (`login.component.html:335-343`), not a
separate journey; it is already visible in `sign-in-live.jpg` if that capture was taken in a
browser.

| File to create | State | Setup | Frame |
|---|---|---|---|
| `recovery-complete-live.jpg` | End of the recovery flow | Complete a password reset through to its final screen | The final confirmation step — `forgot-password-live.jpg` shows only the start |

**The remaining row needs a real inbox.** Password recovery is gated on an emailed verification
code, so the final screen cannot be reached without receiving that code — this row is blocked on the
account owner, not on capture technique.

**Pull the lamp before capturing anything on Login.** The form is hidden until `lampOn` flips
(`login.component.ts:291`); a capture taken on arrival shows an error dialog floating over an empty
dark stage rather than over the form. GSAP's Draggable owns the cord, so synthetic pointer events on
`.lamp-handle` are unreliable — call the component's own `toggleLamp()` through
`ng.getOwningComponent('.v-lamp')` instead, which produces the identical real state. The lamp hue is
randomised on every pull, so each Login capture legitimately carries a different accent colour.

## Portal — 0 (chapter complete, 2026-08-21)

Existing: 7 images. Convention: `<thing>-live.jpg`. Note `empty-library-live.jpg` is mislabelled by
expectation — its registry label is "Library loading boundary", so it shows loading, not empty.

`sections-empty-live.jpg` was captured on 2026-08-21 by emptying both link collections in
`portal.component.ts` (`:1089-1090`) and reverting afterwards. The capture confirms the framing the
row asked for and one detail it did not: the inline **Add Link** button lives inside the *personal*
empty state only (`portal.component.html:310-317`). The shared empty state carries no create
control, so a shared entry is created from the toolbar instead.

## Recipes — 0 (chapter complete)

Existing: 9 images. Convention: `<thing>-live.jpg`.

`delete-confirm-live.jpg` was listed here as outstanding until 2026-08-21; it had in fact already
been captured, wired, and committed in `209802d6`. A re-capture overwrote the committed file before
the staleness was noticed and it was restored with `git show HEAD:<path>`.

## Debt Sonata — 0 (chapter complete, 2026-08-21)

Existing: 15 images. Convention: `debt-<thing>.png` — **no `-live` suffix in this folder.**

`debt-page-empty.png` was captured on 2026-08-21. No forcing was needed — the capture account had no
debt records — so the image is the genuine page state: six zero counts and a single invitation card
replacing the grid. `debt-create-empty.png` shows the empty *form* and is a different state.

## About — 0 (chapter complete, 2026-08-20)

Existing: 5 images. The `milestones` scenario already promised that hover "only emphasizes the
current card and node and never hides or reveals information", and carried an `Emphasis` step, with
no image behind either claim. `about-milestone-hover-live.jpg` now supplies it — see
[Closed](#closed).

## Reminder — 0 (chapter complete, 2026-08-21)

The authored chapter. Adding here means editing the custom walkthrough in `index.html`, not the
scenario registry.

`recovery-live.jpg` was captured on 2026-08-21 and added as a third figure in the `08C Recover from
errors safely` reference strip. It shows the shared unexpected-error dialog raised over a real
Reminder card — which is itself the finding: Reminder owns no bespoke recovery surface, and a failed
write routes through `dialogService.handleError` to `showUnexpectedError` like everywhere else.

**Capture note — the dev server may not rebuild.** A temporary `throw` was added to
`updateTableSingleValue` and the edit never reached the served bundle: `curl localhost:4200/main.js`
showed the old code and a `touch` did not trigger a rebuild. Rather than restart the user's server,
the dialog was raised through the component's own handler with Angular DevTools:
`ng.getOwningComponent(el).dialogService.handleError(c.dialogComponentContainer, new Error(...))`
followed by `ng.applyChanges(c)`. Same code path from `handleError` onward, no source edit at all.
Verify the bundle actually contains a forced state before concluding the state is unreachable.

---

## Closed

| Chapter | Gap | How it was closed |
|---|---|---|
| Patch Notes | Heatmap meaning | `patch/heatmap-live.jpg` captured from the running app and wired into the `signals` section |
| Patch Notes | All six remaining states | Captured 2026-08-16 from the running app and wired into `modes`, `find`, and `manage` — the chapter is now complete |
| About | Hover-only emphasis | `about/about-milestone-hover-live.jpg` captured 2026-08-20 and wired into `milestones`, closing that scenario's unevidenced `Emphasis` step — the chapter is now complete |
| Login | Credential failure dialog | `login/sign-in-error-live.jpg` captured 2026-08-20 and wired into `signin`. The dialog names neither field, so the capture also documents that a rejected sign-in reveals nothing about which half was wrong |
| Resonance | Administrator delete control | `resonance/moderation-control-live.jpg` captured 2026-08-20 by injecting the component's own `:hover` declaration — synthetic events cannot match `:hover` |
| Resonance | Posted-quote confirmation | `resonance/post-success-live.jpg` captured 2026-08-20. Post normally, then `clearTimeout` the component's `postSuccessTimer` so the transient chip persists for the shot; the quote created for it was deleted afterwards |
| Vault | Non-account node editor | `vault/vault-edit-node-live.png` captured 2026-08-20. Select the node with the component's own `onGraphNodeSelect`, then open `openEditNodeNameDialog` with `selectionDetail`; `ng.applyChanges` is required because an `evaluate` call runs outside Angular's zone |
| Vault | Category editor | `vault/vault-edit-category-live.png` captured 2026-08-20. Needs a **custom** category *and* an account filed under it — `overviewStats` only lists categories with a non-zero count, and presets have no editor. Both were created for the capture and deleted afterwards |
| Vault | Graph blocked on mobile | Row dropped by the repository owner 2026-08-20 — the state is real and was captured, but a narrow-viewport image is not wanted in the guide |
| Entertainment | A film reaches Home | References `home/home-entertainment-populated.png` from the `manage` section |
| Recipes | A recipe reaches Home | References `home/home-recipes-populated.png` from the `browse` section |
| Debt Sonata | A debt reaches Home | References `home/home-debt-populated.png` from the `summary` section |
| Home | Three empty panels | `home-entertainment-empty.png`, `home-recipes-empty.png`, `home-activity-empty.png` captured 2026-08-21. The list data *and* the counts the panel derives from were zeroed together, so each shows a coherent state |
| Home | Four overflow rows | `home-reminders-overflow.png`, `home-shortcuts-overflow.png`, `home-debt-overflow.png`, `home-recipes-overflow.png` captured 2026-08-21 by lowering the four thresholds from `20` to `>= 1` in `orbital.component.html`, then reverting |
| Today | Read-only reminder item | `today/today-reminder-readonly-live.png` captured 2026-08-21 with both variants in one frame — the padlocked Anytime chip and the timed block tagged `REMINDER · read-only` |
| Today | Source-refresh failure | **Retired, not captured.** No such surface exists; see the Today section |
| Portal | Both sections empty | `portal/sections-empty-live.jpg` captured 2026-08-21 by emptying both link collections in `portal.component.ts`, then reverting |
| Resonance | Empty quote wall | `resonance/wall-empty-live.jpg` captured 2026-08-21 by forcing `quotes$` to `of([])`, then reverting — quotes are global, so the state is otherwise unreachable without deleting other people's content |
| Debt Sonata | Empty ledger page | `debt/debt-page-empty.png` captured 2026-08-21 from a genuinely empty account; no forcing required |
| Entertainment | Edit dialog | **Retargeted and captured** as `entertainment/edit-inline-live.jpg` — the state is inline card editing, not a dialog |
| Reminder | Write failure recovery | `reminder/recovery-live.jpg` captured 2026-08-21 by raising the component's own `handleError` through Angular DevTools, after a source-level `throw` failed to reach the served bundle |

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
