# Vision Canvas Guide Coverage and Capture Ledger

This ledger records the publication scope of the bilingual field guide. The guide is complete only when every instructional scenario is paired with rendered real-application evidence, page-owned failures stay in their owning chapter, and genuinely shared messages stay in Messages & Errors.

## Published coverage

The **Captures show** column describes only what a stored image actually renders. It is not a
statement of feature coverage: a chapter can satisfy the build gate while leaving real application
states undocumented. Those are counted in **Open gaps** and specified in `CAPTURE-BACKLOG.md`.

| Chapter | Operating scenarios | Real-app captures | Captures show | Open gaps |
|---|---:|---:|---|---:|
| Home | 15 | 35 | Signed-out cover, dashboard loading and ready, life clock, four satellites with two tooltips, narrow rings and cards, week agenda across three days, every panel in both its empty and populated form, the four route-out footers, Entertainment genre bars, Recipes list, Activity rows and footer, urgency strip, quick actions, pinned link | 0 |
| Today | 12 | 22 | Planner orientation, quick add, Anytime create/complete/rename, drawing and saving a timed block, drag modes, move, resize, overlap columns, return to Anytime, a padlocked read-only reminder in both lanes, tracking start/band/stop/short-session, Clear All confirmation and result, unsupported narrow width | 0 |
| Reminder | Authored walkthrough | 22 | Compose, classify, schedule, create, card grid, inline/date/link editing, filters, complete and delete confirmations, pagination, calendar, the error dialog raised by a failed write | 0 |
| Portal | 4 | 7 | Shared and personal library, loading boundary, both sections resolved and empty, category editor, single and batch link entry, standard-account calculator boundary | 0 |
| Vault | 4 | 7 | Locked entry, record-type choice on add, populated graph with legend, populated list, node and category editors, the empty vault card | 0 |
| Entertainment | 5 | 11 | Library loading and loaded, favourites filter, zero-result filter, lookup dialog, required-field validation, card-level controls, inline card editing, the delete confirmation, cancellable refresh progress, update history, the film total reaching Home | 0 |
| Recipes | 4 | 9 | Cookbook library, no-search-match state, recipe detail, ordered steps, blank editor, the delete confirmation, edit-permission boundary, instruction reordering, the cookbook reaching Home | 0 |
| Resonance | 10 | 11 | Loading wall, the resolved empty wall, populated wall and card anatomy, signed-in and visitor composers, keyboard behavior, character-limit feedback, submission and moderation failure recovery, the administrator delete control in a card meta row, the delete confirmation | 0 |
| Debt Sonata | 5 | 15 | The empty ledger, currency totals and due states, card anatomy, empty and complete creation form, new cycle, custom payment, overshoot behavior, expanded and empty history, three confirmations, permanent protection, the ledger reaching Home | 0 |
| Account | 5 | 21 | Two loading boundaries, profile, Inner World counts, milestones, security dates, narrow stack, identity controls, four password states, connection code and three request errors, Vault cadence, danger zone and two deletion states | 0 |
| Login | 4 | 6 | Lamp entrance, returning-member form, inline field validation, account-creation requirements, password-recovery start, rejected credentials over the lit form | 0 |
| Patch Notes | 4 | 11 | Sprint Notes ledger with totals, published release story, search narrowed to one component, status filter menu, activity heatmap popover, the no-results search state, the table and release-hero loading skeletons, an expanded previous release, inline row editing, the new-record footer row | 0 |
| About | 4 | 5 | Product and creator orientation, freshness status, milestones 1-6, hover emphasis on one milestone beside two plain neighbours | 0 |
| Messages & Errors | 5 | 5 | Signed-out recovery route, protected-write confirmation, permission boundary, Connection Lost retry, desktop feedback with changed control | 0 |

**How the capture column is counted.** A chapter's figure is the number of **distinct image sources
the chapter renders**, taken from the registry (or, for the authored Reminder chapter, from
`index.html`). Cross-chapter references count for the chapter that renders them, which is why the
Entertainment, Recipes, and Debt Sonata "reaches Home" images appear in two rows and why several
figures exceed their own folder's file count. Counting by folder instead gives different numbers;
an earlier revision of this ledger mixed the two methods and overstated Patch Notes (13 against a
measured 11) and About (6 against 5) while understating Vault (5 against 7). The numbers above were
measured against the registry on 2026-08-21.

The 13 generated chapters contain 81 mapped operating scenarios. Reminder remains the deliberately authored reference chapter and uses 22 focused captures inside its custom walkthrough.

## Known gaps

**No rows remain open.** Every operating scenario in every chapter is now paired with rendered
real-application evidence.

**Three rows were retired rather than captured**, each for a different and recorded reason:

| Chapter | Row | Why it was retired |
|---|---|---|
| Today | `today-source-failure-live.png` | **The state does not exist.** The row asked for "the message surface Today shows when source data cannot refresh". `refreshReminderSub` (`today.component.ts:927`) subscribes with no error callback, and the only availability branch in `today.component.html` is `@if (isMobile)` at line 1, already captured as `today-unsupported-width-live.png`. A failed reminder stream leaves the board rendered and one item short — indistinguishable from a board that never had it. The chapter's own copy already said so; the row was what was wrong. |
| Vault | `vault-overview-empty-live.png` | **The state was removed from the application.** `overviewStats` filed an uncategorised account into an `Uncategorized` bucket, so the strip's `length === 0` branch was unreachable and `VAULT_OVERVIEW_EMPTY` could never display. Rather than reshape `overviewStats` so a dead message could appear, the branch, its string, its CSS, and its locale entries were deleted (2026-08-21). There is no longer a state to document. |
| Login | `recovery-complete-live.jpg` | **The cost outweighed the evidence.** Reaching the final recovery screen requires performing a real password reset on a live account — an emailed verification code plus a new password — purely to photograph one confirmation screen. `forgot-password-live.jpg` already documents where the flow starts. Retired by the repository owner (2026-08-21); do not re-open it. |

**Thirteen rows were closed on 2026-08-21** — all seven Home panel gaps, Today's read-only reminder,
Portal's resolved-empty sections, Resonance's empty wall, Debt Sonata's empty ledger, Entertainment's
inline card edit, and Reminder's write-failure dialog.

**Four earlier rows were closed before that**: the Patch activity heatmap was captured from the
running application, and the Entertainment, Recipes, and Debt Sonata "reaches Home" claims were
satisfied by referencing the Home panel evidence already stored under `assets/images/home/`.

This ledger previously described intended scope as though it were delivered scope. Patch Notes
claimed loading/empty states, heatmap meaning, and authorized maintenance; Resonance claimed an
empty wall and moderation; Entertainment claimed editing, validation, and deletion. None of those
had captures. The claims are corrected above, and three were retired outright because the described
state does not exist as a distinct page surface:

- **Vault permissions and protected recovery** — Vault opens only add-account, edit-category, and
  edit-non-account dialogs. Permission and recovery messaging is the shared Messages & Errors set.
- **Login provider differences** — the Google control is one conditional button on the sign-in
  form, not a separate provider journey.
- **Portal recovery** — Portal surfaces the shared error dialog; it owns no distinct recovery state.

A claim belongs in this ledger only when an image in `assets/images/` renders it.

## Evidence discipline

- Every listed image is a crop of the running application. No generated interface reconstruction is used as product evidence.
- Crops are stored physically in the image file. The guide registry contains no CSS crop or zoom metadata.
- Narrow cards, dialogs, and portrait evidence use the horizontal media-and-notes arrangement on larger screens and collapse to a vertical stack on phones.
- Screenshot wrappers shrink to the image's intrinsic rendered width and remain transparent outside it, so a wide viewport cannot introduce white side gutters.
- Full-page captures appear only when the complete composition is the subject. Dialog and control demonstrations are framed around the relevant surface.
- Chinese UI labels and messages follow `src/app/common/locale/locale.zh.ts`; English labels follow `locale.en.ts`. Explanatory prose remains structurally mirrored across languages.
- Page-specific validation, errors, and destructive consequences remain in their chapter. Shared access, confirmation, permission, retry, and feedback patterns are centralized without replacing page-specific instructions.
- The disposable guide account contains only guide demonstration data. The published guide embeds screenshots and does not depend on that account or its records at runtime.

## Build gate

`tools/audit-guide.mjs` is run automatically before the portable guide is generated. It rejects publication when:

- a generated chapter has a section without operating scenarios;
- an English and Chinese section or scenario structure differs;
- any scenario has no rendered capture;
- a capture is not mapped to an operating scenario or lacks mirrored bilingual copy;
- a capture path is missing or outside `assets/images/`;
- an image is orphaned or duplicates another stored file byte for byte;
- a file extension does not match the actual JPEG, PNG, GIF, WebP, or SVG bytes; or
- stale CSS crop metadata is present.

The canonical guide and the self-contained portable guide are produced from the same HTML, CSS, scripts, and image set. The portable file is generated only after this gate succeeds.
