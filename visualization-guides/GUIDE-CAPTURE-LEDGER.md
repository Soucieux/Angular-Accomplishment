# Vision Canvas Guide Coverage and Capture Ledger

This ledger records the publication scope of the bilingual field guide. The guide is complete only when every instructional scenario is paired with rendered real-application evidence, page-owned failures stay in their owning chapter, and genuinely shared messages stay in Messages & Errors.

## Published coverage

| Chapter | Operating scenarios | Real-app captures | Coverage focus |
|---|---:|---:|---|
| Home | 15 | 28 | Every widget, satellite, value, link, empty/populated state, urgency, activity, responsive behavior, and source-page consequence |
| Today | 12 | 21 | Planner orientation, quick add, edit, move, resize, tracking, clearing, read-only Reminder items, silent failures, and unsupported width |
| Reminder | Authored walkthrough | 21 | Compose, classify, schedule, create, read, edit, filter, complete, delete, pagination, confirmations, and recovery |
| Portal | 4 | 6 | Shared/personal ownership, categories, single/batch links, card behavior, administrator calculator boundary, and recovery |
| Vault | 4 | 4 | Passphrase boundary, graph/list views, record creation, relationships, permissions, and protected recovery |
| Entertainment | 5 | 8 | Loading/populated libraries, selected and zero-result filtering, add/edit/history, refresh, validation, deletion, and Home consequences |
| Recipes | 4 | 7 | Library/search, details, editor inputs, ingredients, steps, reordering, permissions, deletion, and Home consequences |
| Resonance | 10 | 10 | Loading/empty/populated wall, card anatomy, signed-in/visitor posting, keyboard behavior, validation, recovery, and moderation |
| Debt Sonata | 5 | 13 | Empty/populated states, complete creation form, payments, history, editing, protection, confirmations, known overshoot behavior, and Home consequences |
| Account | 5 | 21 | Loading/loaded cards, every account statistic, identity/password states, connection requests and errors, Vault cadence, and danger actions |
| Login | 4 | 5 | Lamp entry, sign in, inline validation, sign up, verification requirements, recovery, provider differences, and failure handling |
| Patch Notes | 4 | 6 | Sprint/release modes, loading/empty states, combined filters, statistics, heatmap meaning, authorized maintenance, and failures |
| About | 4 | 5 | Product orientation, status, all six figures, every milestone, hover-only emphasis, and read-only behavior |
| Messages & Errors | 5 | 5 | Signed-out access, protected-write confirmation, permission errors, connection/session recovery, and desktop/mobile feedback |

The 13 generated chapters contain 81 mapped operating scenarios. Reminder remains the deliberately authored reference chapter and uses 21 focused captures inside its custom walkthrough.

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
