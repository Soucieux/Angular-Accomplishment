# Vision Canvas Guide Coverage and Capture Ledger

This ledger records the publication scope of the bilingual field guide. The guide is complete only when every instructional scenario is paired with rendered real-application evidence, page-owned failures stay in their owning chapter, and genuinely shared messages stay in Messages & Errors.

## Published coverage

The **Captures show** column describes only what a stored image actually renders. It is not a
statement of feature coverage: a chapter can satisfy the build gate while leaving real application
states undocumented. Those are counted in **Open gaps** and specified in `CAPTURE-BACKLOG.md`.

| Chapter | Operating scenarios | Real-app captures | Captures show | Open gaps |
|---|---:|---:|---|---:|
| Home | 15 | 28 | Signed-out cover, dashboard loading and ready, life clock, four satellites with two tooltips, narrow rings and cards, week agenda across three days, Reminders/Shortcuts/Debt panels empty and populated, Entertainment genre bars, Recipes list, Activity rows and footer, urgency strip, quick actions, pinned link | 7 |
| Today | 12 | 21 | Planner orientation, quick add, Anytime create/complete/rename, drawing and saving a timed block, drag modes, move, resize, overlap columns, return to Anytime, tracking start/band/stop/short-session, Clear All confirmation and result, unsupported narrow width | 2 |
| Reminder | Authored walkthrough | 21 | Compose, classify, schedule, create, card grid, inline/date/link editing, filters, complete and delete confirmations, pagination, calendar | 1 |
| Portal | 4 | 6 | Shared and personal library, loading boundary, category editor, single and batch link entry, standard-account calculator boundary | 1 |
| Vault | 4 | 4 | Locked entry, record-type choice on add, populated graph with legend, populated list | 5 |
| Entertainment | 5 | 9 | Library loading and loaded, favourites filter, zero-result filter, lookup dialog, card-level controls, cancellable refresh progress, update history, the film total reaching Home | 3 |
| Recipes | 4 | 8 | Cookbook library, no-search-match state, recipe detail, ordered steps, blank editor, edit-permission boundary, instruction reordering, the cookbook reaching Home | 1 |
| Resonance | 10 | 10 | Loading wall, populated wall and card anatomy, signed-in and visitor composers, keyboard behavior, blank draft, character-limit feedback, submission and moderation failure recovery | 4 |
| Debt Sonata | 5 | 14 | Currency totals and due states, card anatomy, empty and complete creation form, new cycle, custom payment, overshoot behavior, expanded and empty history, three confirmations, permanent protection, the ledger reaching Home | 1 |
| Account | 5 | 21 | Two loading boundaries, profile, Inner World counts, milestones, security dates, narrow stack, identity controls, four password states, connection code and three request errors, Vault cadence, danger zone and two deletion states | 0 |
| Login | 4 | 5 | Lamp entrance, returning-member form, inline field validation, account-creation requirements, password-recovery start | 2 |
| Patch Notes | 4 | 7 | Sprint Notes ledger with totals, published release story, search narrowed to one component, status filter menu, activity heatmap popover with legend and year-by-month grid | 6 |
| About | 4 | 5 | Product and creator orientation, freshness status, all six figures, milestones 1–6 | 1 |
| Messages & Errors | 5 | 5 | Signed-out recovery route, protected-write confirmation, permission boundary, Connection Lost retry, desktop feedback with changed control | 0 |

The 13 generated chapters contain 81 mapped operating scenarios. Reminder remains the deliberately authored reference chapter and uses 21 focused captures inside its custom walkthrough.

## Known gaps

34 real application states are documented in prose or implied by a scenario but have no rendered
capture. All are specified — filename, source line, setup, framing — in `CAPTURE-BACKLOG.md`.

Four of the original 38 are now closed: the Patch activity heatmap was captured from the running
application, and the Entertainment, Recipes, and Debt Sonata "reaches Home" claims were satisfied by
referencing the Home panel evidence already stored under `assets/images/home/`.

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
