# Vision Canvas Field Guide

This folder contains the web-first, bilingual field guide for all 13 routed Vision Canvas pages plus one guide-only shared message and error reference. One canonical HTML, CSS, and JavaScript source supports direct local use, Firebase Hosting, and a generated self-contained offline file. The guide does not include or generate PDFs.

## Included pages

Home, Today, Reminder, Portal, Vault, Entertainment, Recipe, Resonance, Debt Sonata, Account, Login, Patch Notes, and About share one responsive guide shell and mirrored English and Chinese content. Messages & Errors documents behavior reused by several routes without pretending it is another application page.

Reminder establishes the evidence standard for the complete guide: every feature or state image comes from the running application. The other chapters follow the same pattern with real, privacy-safe captures placed beside the exact workflow they explain. Generated interface reconstructions and summary-only screenshots are not used as substitutes for actual page states.

## Authoring standard

Treat each chapter as operating instructions, not a screenshot gallery.

- Use only screenshots captured from the running application. Never reconstruct, generate, or invent an interface state.
- Export each screenshot as a real image crop containing the complete control, result, validation state, or dialog being explained. Do not simulate a crop with CSS zoom, scaling, or `object-fit`, because responsive cards can hide meaningful content.
- Preserve native screenshot detail. Never enlarge a small capture to fill a card; use a tighter crop from a higher-resolution running-app capture instead.
- Choose the capture arrangement from the evidence shape. Wide controls and timelines may stack above their explanation; tall dialogs, narrow cards, and portrait crops should use the side-by-side presentation so handwritten notes and explanatory text occupy the otherwise empty right column. Collapse back to a vertical stack on narrow screens.
- Size side-by-side media to the capture's real intrinsic width, capped at the shared compact-media limit. Never stretch the media column beyond the screenshot and expose a white gutter; handwritten notes and explanation own the remaining width.
- Every screenshot wrapper must shrink to the image's intrinsic rendered width and remain transparent outside those pixels. Never paint a full-width white media surface behind a narrower screenshot.
- Let the shared adaptive layout place compact screenshots beside their notes and captions on wide screens. Panoramic evidence may use the larger media column, but it must preserve enough space for the explanation instead of stretching a small source file.
- Crop blank space that belongs to the captured page or viewport before adding the image. A guide card must not preserve an empty lower panel merely because it appeared below the relevant control in the original full-page screenshot.
- Frame dialogs around the dialog itself, with only enough surrounding page context to establish where it appeared.
- Add a handwritten note, arrow, or line only when it clarifies the next action or the relationship between controls. The annotation must not cover meaningful UI.
- In a side-by-side capture, place the handwritten note opposite the image and make every connector terminate at the image edge. Never point an arrow away from its evidence; hide the connector when the image and note stack vertically and the direction would become ambiguous.
- Omit generic overview screenshots unless the full-page composition is itself necessary to understand the workflow.
- On wide screens, split an image-free chapter introduction into a lead column and a detail column so its summary, actions, and key facts use the available width. Keep the section content-height with controlled top and bottom padding; do not inherit a full-viewport minimum height or restore an unused visual column. Collapse the composition into normal reading order on narrow screens.
- Cover prerequisites, every input and validation rule, primary steps, secondary triggers, success outcomes, cancellation, destructive confirmations, permissions, platform restrictions, user-visible errors, and recovery or rollback behavior.
- Keep page-specific validation and errors in the owning chapter. Put only genuinely shared access, confirmation, blocking, retry, error, and feedback behavior in the Messages & Errors reference.
- Copy Chinese interface labels and messages from `src/app/common/locale/locale.zh.ts`; do not independently translate an existing app string. Use `locale.en.ts` as the matching English source.
- Never invent an error dialog. When the application handles a failure silently or by automatic resynchronization, state that behavior explicitly.
- Capture state in the dedicated disposable guide account when the workflow cannot be demonstrated accurately with existing data. Prefix temporary records with `Guide Demo`, record them in `GUIDE-CAPTURE-LEDGER.md`, and delete only the records created for the current capture run after every dependent screenshot is complete.
- Do not change credentials, remove the guide account, or mutate unrelated records merely to obtain a capture. Validation states and destructive confirmations should stop before the irreversible action unless that action is required to document the resulting state and has an explicit cleanup path.
- Audit the page component, template, models, tests, dialog service, and localized strings together before calling a chapter complete.

## Structure

```text
visualization-guides/
├── index.html
├── assets/
│   ├── images/
│   │   ├── reminder/
│   │   └── one folder per captured page
│   ├── scripts/
│   │   ├── guide-pages.js
│   │   ├── guide-shared-reference.js
│   │   ├── guide-scenarios.js
│   │   ├── guide-complete-scenarios.js
│   │   ├── guide-content.js
│   │   └── guide.js
│   └── styles/
│       └── guide.css
├── portable/
│   └── accomplishment-field-guide.html
└── tools/
	├── audit-guide.mjs
	└── build-portable-guide.mjs
```

- `index.html` owns the semantic guide shell, inline icon library, and authored Reminder walkthrough.
- `assets/scripts/guide-pages.js` owns the 13 routed-page registry, mirrored English and Chinese content, and real scenario-capture mappings for generated chapters. Each capture declares the zero-based `scenario` it demonstrates. A section with exactly one scenario may omit the mapping because the renderer attaches every section capture to that sole scenario; multi-scenario sections must map every capture explicitly.
- `assets/scripts/guide-shared-reference.js` owns the guide-only shared message/error page.
- `assets/scripts/guide-scenarios.js` and `guide-complete-scenarios.js` attach operating scenarios, inputs, dialogs, errors, and recovery notes to each generated chapter.
- `assets/scripts/guide-content.js` owns the authored Reminder copy.
- `assets/scripts/guide.js` owns page selection, language switching, navigation, reading progress, and generated page articles.
- `assets/styles/guide.css` owns the responsive design system and the shared real-screenshot walkthrough treatment.
- `tools/audit-guide.mjs` rejects missing or unmapped scenario evidence, incomplete bilingual capture copy, orphaned or byte-duplicate images, missing files, stale CSS-crop metadata, language-structure drift, and image extensions that do not match their bytes.
- `tools/build-portable-guide.mjs` runs that audit, then embeds the canonical styles, scripts, and screenshots into one offline HTML file.

## Open locally

Open `index.html` directly in a browser. The guide uses address parameters while keeping page changes inside the same document:

- `?page=directory&lang=en` opens the English guide directory.
- `?page=home&lang=zh` opens the Chinese Home guide.
- `?page=reminder&lang=en` opens the English Reminder walkthrough.

For a single transferable file, open `portable/accomplishment-field-guide.html`. It includes its required styles, scripts, and screenshots and does not require a server or network connection.

## Generate the portable guide

Run `node visualization-guides/tools/build-portable-guide.mjs` from the repository root after changing the canonical guide. The command first enforces the coverage and asset gate, then replaces `portable/accomplishment-field-guide.html`; the generated file should not be edited manually. Run `node visualization-guides/tools/audit-guide.mjs` when only the authoring audit is needed.

## Online hosting

The Angular build copies only the public guide source into `/guide/` and copies the portable document into `/guide/offline/`. The guide will therefore be available after the normal Firebase deployment at addresses shaped like:

- `/guide/?page=directory&lang=en`
- `/guide/?page=reminder&lang=zh`
- `/guide/offline/accomplishment-field-guide.html`

The build tools and this documentation are not included in the public guide output.

## Updating the guide

Keep routed-page metadata, both languages, and capture mappings together in `assets/scripts/guide-pages.js`; keep shared service behavior in `guide-shared-reference.js`. Attach every screenshot to the exact instructional scenario it demonstrates rather than placing it in a section-level gallery. Before export, audit every routed chapter and every authored scenario for at least one rendered real-app capture; an image file that is not mapped and rendered does not count as coverage. Every capture must come from the running app, show the documented state, avoid exposing private information, retain readable native detail, and stop at the actual app surface without unrelated blank viewport space. Open dialogs, filters, validation, and edit modes without saving when a state can be demonstrated non-destructively. When a user-visible Angular workflow changes, audit the component, dialogs, errors, and locale sources, update the corresponding guide chapter, and regenerate the portable HTML from the same source.
