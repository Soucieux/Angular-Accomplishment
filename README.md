**Read this in other languages:** English | [简体中文](README.zh-CN.md)

# 🌌 Vision Canvas

> A private, self-designed personal management suite built with **Angular 21** — centralizing entertainment tracking, financial reminders, development logging, and daily life analytics in one cohesive, secure interface.

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Cloudbase](https://img.shields.io/badge/Tencent_Cloudbase-3.x-00A3FF)](https://cloudbase.net)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-21-7C3AED)](https://primeng.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

---

## Table of Contents

- [Core Features](#-core-features)
- [Development Timeline](#-development-timeline)
- [Authentication & Data Backends](#-authentication--data-backends)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)

---

## ✨ Core Features

| Module | Description | Status |
| :--- | :--- | :---: |
| **Today** | Daily planner and time-blocking canvas.<br>- **Drag-to-create** timed blocks on an hour-grid calendar<br>- **Drag-to-move** for repositioning existing blocks<br>- **Resize handles** to adjust block duration<br>- Quick-add lane for untimed tasks with keyboard confirm<br>- **Live tracking** session with elapsed timer<br>- Current-time indicator scrolled into view on open<br>- Reminder items injected live from the Reminder module and refreshed at midnight — timed ones appear in the calendar lane, untimed ones surface read-only in the quick-add lane | Beta |
| **Home** | **Orbital dashboard** built around a *Life Clock* displaying the current time in real-time.<br>- Concentric progress rings for **year, month, week, and day**<br>- **Satellite stat discs** with live counts for movies, patch notes, quotes, and recipes<br>- Glass widget panels: upcoming reminders, debt payments, recent activity, entertainment genre breakdown, a recipe list, and saved link chips<br>- **Week agenda** view and quick-action pill buttons<br>- Fully responsive mobile layout | Active |
| **Entertainment** | Media tracker for **movies and TV dramas** with rich metadata support.<br>- **Third-party API** lookup for title, genre, cast, and cover image, with a **scrape fallback** that backfills a missing rating or first release date<br>- Firebase / Cloudbase image storage and CDN delivery<br>- **Text search** across titles, plus category filtering, favourites toggle, and **colour-coded rating indicators**<br>- Full add / deletion history with timestamps | Stable |
| **Reminder** | Account expense tracker with real-time cloud sync.<br>- **Inline cell editing** with keyboard confirm flow<br>- Colour-coded active, overdue, and paid-off status indicators<br>- **Start / end time slots** — optional HH:MM time range per item with auto-computed end offset<br>- **Per-card delete button** for quick single-item removal<br>- **Shared reminders** *(username / password accounts only — cross-account sharing runs on CloudBase)* — items marked shared appear on connected accounts in real time, with a shared-only filter chip and creator badges<br>- Persistent per-user state | Active |
| **Portal** | Personal AI search hub and link manager.<br>- **Chip-based category filters** for AI tool discovery with category management dialog<br>- Saved link management with category assignment; titles are **auto title-cased**, and favicons resolve to **real brand logos** (Brandfetch, with a favicon fallback)<br>- **Date Calculator** — date-range arithmetic with CloudBase persistence; collapsible via header click<br>- Shared link flag to distinguish personal from shared entries<br>- Fallback colour avatars when logo fetch fails | Beta |
| **Debt Sonata** | Debt tracking canvas with full payment history.<br>- **Card-based ledger** supporting CNY and CAD currencies<br>- Preset and custom **payment chips** with per-card progress bar<br>- Paid-off ribbon state and coral card styling<br>- Summary card with per-currency totals<br>- Full payment history timeline per entry<br>- **New-cycle** toggle when editing an entry — clears its payment history and resets the balance for a fresh cycle | Active |
| **Resonance** | Personal quote vault.<br>- Author attribution and timestamps<br>- **Anonymous browsing** support for public quotes<br>- Ownership-based edit and delete permissions | Active |
| **Recipe** | Personal cookbook with per-category colour theming.<br>- List, detail, and editor views, with narrow-screen single-column pagination<br>- **Ingredient groups** with type badges and bilingual name support *(Chinese + English)*; matching ingredient names auto-highlight as pills within step text<br>- Live **servings scaler** and step-by-step instruction view<br>- Category colour themes — *rose · green · purple · amber · pink*<br>- Drag-to-reorder steps | Active |
| **Patch Notes** | Internal development log with two views.<br>- *Patch Notes* — add, edit, and delete entries per component; bug flag per entry; status filter (Active / Resolved); paginated with correct rowspan recalculation after date sorting<br>- **Activity heatmap** popover on the stats strip — monthly entry counts across years with intensity bands and locale-aware month labels<br>- *Release Notes* — versioned release cards with section headings, badge chips, and summaries | Active |
| **Account** | Personal account management hub with navy sky theme.<br>- Identity card — username editing and email display with verified badge<br>- Password change with strength meter and visibility toggle<br>- **Second Brain stats** — live counts for movies, reminders, debts, and recipes<br>- Milestone timeline with connector lines and colour-coded dates<br>- **Connected Accounts** *(username / password accounts only — account linking runs on CloudBase)* — link another account by share code, approve or decline requests, and unlink or re-connect; shares reminders with linked accounts<br>- **Cadence** panel controlling how long the vault stays unlocked after you leave (always require, a fixed minute window, or until reload)<br>- Danger zone card for account deletion with a confirmation guard, plus **vault-passphrase removal** (greyed out until one is set) for a forgotten passphrase (your vault data is kept) | Active |
| **Login** | Authentication entry point.<br>- Email / password login on every platform, plus **Google Sign-In** on **browser and installed web app only** *(mobile & desktop)* — hidden in the Tauri desktop and iOS native apps, which don't offer it yet<br>- Sign-up flow for new user registration with an email verification code and a live password-strength checklist<br>- **Forgot password** — email-based reset flow with a verification code<br>- Route guards protecting all authenticated pages<br>- Post-login redirect to last-visited route<br>- Sidebar presence row: avatar, online status, and account menu popover | Stable |
| **About** | Professional history timeline.<br>- Interactive milestone entries<br>- **Animated gradient background** | Stable |
| **Vault** | Account links graph with a **Slate Steel** theme.<br>- **Passphrase gate** — the page is protected by a per-user passphrase, set on first visit and required to unlock<br>- **Force-directed graph** of accounts (app-tile nodes, coloured by category — **segmented when an account holds several**), emails (circles), phones (diamonds), and links (hexagons)<br>- **Click-to-trace** — highlights linked nodes by hop distance (direct / second-degree) and dims the rest; drag, pan, and zoom<br>- **Category overview** chips with **inline rename / delete**, plus a **Verified** chip that tallies verified accounts and doubles as a filter; the **legend doubles as a type filter** — click a type (or Verified) to isolate it, click again to clear<br>- **Preset + custom categories** — five built-in presets (Transport · Finance · Social · Shopping · General), each with a unique colour and icon, plus your own<br>- **Add-account dialog** with **multi-select categories**, a duplicate-name guard, and multi-connection wiring; **link-mode** to connect nodes by hand<br>- **Non-account identifiers** — a two-step wizard also adds a standalone email, phone, or notes entry and links it to another identifier as a **backup** (dashed edge on the map)<br>- **Centralized node actions** — in the graph accounts only link; a non-account node is renamed or deleted through an edit-name dialog, while account edits live in List view<br>- **Auto-fit map** opens framed to every node, stepping the base scale down as the graph grows; **inline account-name editing**<br>- List view with inline link editing, **multi-category assignment**, and **free-form note connections** kept off the graph; on narrow screens the graph gives way to a **List view** prompt; per-user CloudBase persistence | Beta |

---

## ⏳ Development Timeline

*Reconstructed from 300+ meaningful commits across the project history.*

### 🏗 R0 — Scaffolding (January 2024 – September 2024)

| Period | Milestone |
| :--- | :--- |
| **January 2024** | - Angular workspace initialized<br>- Project scaffolding and directory structure established |
| **February 2024** | - Basic component skeletons created<br>- Navigation drawer shell added with routing stubs and home icon<br>- Multiple project setup iterations committed |
| **June 2024** | - Navigation drawer and home page icon added<br>- Client-side router fully configured with **page transition animations**<br>- Google Fonts and Material Symbols icon set integrated<br>- First wave of Dependabot security dependency bumps merged |
| **July 2024** | - **Firebase Hosting** deployment pipeline established<br>- Build scripts configured; a failed deployment reverted and re-applied cleanly |
| **September 2024** | - Firebase project connected; **user authentication** initialized<br>- Firestore database provisioned with initial collection schema |

---

### ✅ R1 — Feature Development (February 2025 – June 2026) · Completed

| Period | Milestone |
| :--- | :--- |
| **February 2025** | - Firestore database and Home page scaffolded<br>- **Entertainment** initialized — TV Shows grid layout built<br>- Douban API proxy server configured to bypass CORS<br>- Firebase Storage image retrieval pipeline established<br>- Movie data model refactored; image upload to Firebase implemented |
| **March 2025** | - Full **mobile layout** for iPhone 16 Pro and Samsung Galaxy<br>- Genre category chip system with dynamic counts per category<br>- Per-card entrance animations; access-denied page for unauthenticated users<br>- Login and logout integrated directly into Entertainment<br>- Multiple Firebase Cloud Function instances deployed for **parallel image serving**<br>- Complete visual overhaul — new colour palette, typography, and card design language |
| **June 2025** | - PrimeNG dialog and message service compatibility conflict resolved<br>- Movie list state management bug fixed when adding a new entry to an existing list |
| **September 2025** | - **Add-movie dialog** built with live Douban metadata search, real-time cover preview, and submit-disable guard<br>- Image and metadata upload to Firebase Storage and Firestore<br>- Cascading Storage deletion on movie removal; statistics chip updated after deletion<br>- Movie list sorted by first release date |
| **October 2025** | - Error dialogs for network failures and invalid movie ID searches<br>- Confirmation dialog for destructive retrieval actions; animated progress bar in the upload flow<br>- History dialog initialized to log all add operations<br>- **`*ngIf` / `*ngFor` fully migrated** to Angular 17+ `@if` / `@for` control-flow syntax across the entire codebase |
| **November 2025** | - **Login** page built with email / password sign-in and route guard<br>- Post-login redirect to last-visited route; mobile-responsive login layout<br>- Logout button repositioned into the navigation drawer<br>- Website title and icon updated globally; home page slogan refreshed |
| **December 2025** | - Entertainment: favourite / unfavourite toggle; **colour-coded rating indicators**; all dialogs made fully mobile-compatible; history dialog records deletion metadata<br>- **Patch Notes** module launched — expandable table rows per component; status dropdown (Active / Resolved); full add / edit / delete flow with dedicated dialogs; bug-flag checkbox per entry |
| **January 2026** | - **About** page launched with animated gradient background and interactive professional history timeline<br>- Patch Notes: pagination with correct rowspan recalculation after date sorting<br>- **Reminder** module built across two tables in a single sprint:<br>&nbsp;&nbsp;• *Account Expense Ledger* — per-cell inline editing, checkbox confirmation flow<br>&nbsp;&nbsp;• *Bank Debt Tracker* — paginator, mobile tooltips, delete flow, overdue / active colour states |
| **February 2026** | - Genre editing added to Entertainment — reassign a movie to a different genre post-upload<br>- isFavourite feature refined with improved state handling<br>- Second Entertainment mobile compatibility pass; package dependencies updated |
| **March 2026** | - **Abstract base class** introduced to unify Firebase and Tencent Cloudbase under a shared service API<br>- **Dual-backend dynamic loading** based on detected user region at startup<br>- `_openid` ownership field on every document; admin vs. regular user permission model enforced across all modules<br>- CN-region login via Tencent Cloudbase credentials; country detection at startup<br>- Application-wide constants extracted to `app.constant.ts`; login state removed from local storage |
| **April 2026** | - Entertainment images migrated to **Tencent Cloudbase CDN** for CN-region performance<br>- **SSRF security vulnerability** identified and patched<br>- Reminder currency icon updated; disabled-cell field and IP-lookup features removed |
| **May 2026** | - Seven sequential UI style passes (Parts I–VII) across the entire app — Entertainment, Home, Patch Notes, Reminder, and global navigation systematically polished<br>- **Home** orbital dashboard launched: *Life Clock* with real-time display and concentric year / month / week / day progress rings; satellite stat discs; quick-action pill buttons; mobile-responsive layout<br>- Login page entrance animations added; **sign-up flow** completed for new user registration<br>- **Recipe** launched: personal cookbook with list / detail / editor views; ingredient groups with type classification and colour-coded badges; live servings scaler; step-by-step instructions; category chip filtering; drag-to-reorder steps<br>- **Resonance** module launched: personal quote vault with author attribution, timestamps, and anonymous browsing support<br>- **Portal** module built: AI search hub with chip-based category filters, search history, and saved link management panel<br>- Search feature added to Entertainment with dedicated search dialog<br>- Full JSDoc documentation and access modifier pass across all services and components; environment template added for safer onboarding |
| **June 2026** | - **Debt Sonata** page launched: card-based debt ledger with CNY / CAD currency; preset and custom payment chips; paid-off ribbon; summary card with per-currency progress bars; all edits routed through dialogs<br>- Date Calculator extracted from Reminder and integrated into **Portal**<br>- Sidebar account row redesigned — *desktop* popover with avatar, name, online status, sign-out; *mobile* collapses to a confirm dialog<br>- Ownership-based permission checks added across Entertainment, Resonance, and Portal<br>- **Three-mode navigation**: desktop (≥1300px) collapsible side drawer; compact overlay (941–1300px) with floating hamburger and full-width backdrop; mobile (≤940px) bottom nav bar<br>- Account actions (avatar, online status, sign-out) added to the **mobile bottom nav**<br>- Home expanded with new panels: week calendar, activity feed, debt tracker, recipe list, quick-access link chips; concentric ring sizing made responsive<br>- **PWA support** added — installable on iOS and Android with web manifest, themed status bar, and safe-area insets for notched devices<br>- **Web push notifications** — users subscribe via the account popover; daily digest fires at 09:00 CST via CloudBase scheduled function; subscription state stored per-user, cleared on sign-out |

---

### 🚀 R2 — Polish & Refinement (June 2026 – Present)

| Period | Milestone |
| :--- | :--- |
| **June 2026** | - Phase R2 begins — R1 feature set complete and stable<br>- **Today** page launched — hour-grid calendar with drag-to-create blocks, drag-to-move, resize handles, live tracking timer, and quick-add untimed task lane<br>- **Tauri push notifications** — subscribe/unsubscribe via account popover; notification layer simplified to Tauri-native only; `NotificationSchedulerService` extracted to handle daily reminder scans independently of `AppComponent`<br>- Nav icon selectors migrated from fragile `nth-child` to `data-nav-id` attribute identity<br>- **Desktop right-click context menu** — custom overlay with clipboard actions (copy / cut / paste / select-all), nav shortcuts, and sign-in / sign-out; uses Tauri clipboard plugin to bypass macOS native paste confirmation<br>- Codebase restructured: `LoadingTimeoutService` renamed to `TimeoutService` and moved into `common/timeout/`; utilities moved into `common/utilities/`; `navigation/` folder renamed to `mobile-bottom-nav/`; `context-menu` component renamed and moved to `fontend/desktop-context-menu/`<br>- **Account** page launched with navy sky theme (`#1e3a8a → #7dd3fc`): identity card with username / password editing, Second Brain stats panel, milestone timeline, and danger zone for account deletion; wired into route, nav bar, and account popover button<br>- Global placeholder font inheritance fix — all inputs now correctly inherit the app font<br>- **Forgot password** flow added to Login — email-based reset with CloudBase auth<br>- **Delete account** dialog and service — confirmation guard, auth method, and nav cleanup on success<br>- **Typed error class hierarchy** introduced (`AppError`, `AuthError`, `NetworkError`, etc.) replacing raw `unknown` catches across all pages; auth helper methods centralised<br>- Nexus links section redesigned with admin gate and layout cleanup<br>- Dialog button styles standardised across all dialogs (gradient primary, ghost cancel)<br>- Portal **category management dialog** added; shared link flag wired to link documents<br>- Portal Date Calculator collapsible via header click<br>- **Reminder** start / end time slot fields added — optional HH:MM range per item with auto-computed end offset<br>- **Today** calendar injects live reminder items in a dedicated lane with automatic midnight refresh<br>- Gradient text title descender clipping fixed across Portal, Recipe, Patch Notes, and Resonance<br>- Home dashboard shared links now correctly filtered after logout on a stale session<br>- **Shared `blocked-card` component** — replaces the old `access-denied` component across all protected pages; accepts optional `icon`, `title`, and `body` inputs for reuse in any gating context<br>- **Today mobile blocker** — narrow viewport (≤940px) shows a `blocked-card` instead of the planner; detection uses `Utilities.isNarrowViewport()` with no CDK dependency<br>- **Dual-locale string system** — `locale.en.ts` (EN) and `locale.zh.ts` (ZH) with a `locale-strings.ts` barrel that resolves the active language from `localStorage` once at module load; `LocaleService.applyLocale()` persists the choice and reloads<br>- **Language switch** button added to the account popover on both desktop sidebar and mobile bottom-nav; triggers a confirm dialog before reloading<br>- Reminder cards: **per-card delete button** added in the card header row |
| **July 2026** | - **Connected Accounts** launched — link another account by share code with an approve / decline request flow; per-user adjacency model so each account sees only its own connections' shared items, with unlink and re-connect handling<br>- **Shared reminders** — items marked shared surface on connected accounts in real time (admin read Cloud Function plus a `sharedRev` signal on each user's own document, working around CloudBase watch not pushing other users' documents); shared-only filter chip and creator badges on the Reminder page<br>- Connected accounts' shared activity merged into the **Home** recent-activity feed<br>- **Portal** links gain a shared flag with an optional category<br>- **Vault** placed behind an authentication guard; **Patch Notes** opened to public access<br>- **Vault graph** — the legend now doubles as a type filter (click a type or *Verified* to isolate, click again to clear); accounts gain inline category assignment; link (hexagon) nodes added<br>- **Portal favicons** proxied through a Firebase function so icons load on CN networks<br>- **Today** — short tracked records (under 15 min) reveal their time range on hover<br>- **Portal** — category deletion fixed; the delete now uses the ownership-scoped query CloudBase's security rules require<br>- **Reminder** — the mobile add-item composer aligns its link / date / time with the list cards<br>- **Mobile bottom-nav** — the all-sections grid no longer repeats the four dock destinations, and first-tap navigation plus active-page highlighting are fixed<br>- **Home** — orbital labels enlarge for Chinese on mobile and the loading text is localized<br>- **Vault** — accounts now hold **multiple categories** (node tiles split into colour segments); the old *password* connection became a **free-form note** kept off the graph, added inline in edit mode; custom categories can be **renamed or deleted** from the overview; a loading guard shows a spinner and retries on timeout<br>- **Portal** — link favicons are **cached offline** by a daily scheduled job (falling back to the live proxy); *created* / *last-visited* timestamps now use the app's display format; the nav icon changed to avoid clashing with the language switch<br>- Item **statistics self-heal** — deleting another user's item no longer corrupts your totals; each account reconciles its counts on load<br>- **Debt Sonata** — reset / delete confirm prompts dismiss when you click elsewhere; the add button repositions to the corner on mobile<br>- Compact-nav auto-collapse is **no longer persisted**, so it never overrides your saved wide-screen layout<br>- **Vault** — five **preset categories** (each a unique colour + icon) alongside custom ones; **inline account-name editing**; the **map auto-fits** on open, stepping its base scale down as the graph grows; on mobile the graph is replaced by a **List-view** prompt<br>- **Card entrance animations** — staggered reveal added to cards and rows across Entertainment, Reminder, Patch Notes, Portal, Today, About, Account, Debt Sonata, and Home<br>- Shared **`Utilities.clamp`** helper with utility-method deduplication; the glass-card docks to the bottom on touch devices<br>- **Vault** — the page now sits behind a **passphrase gate** (first-visit setup, then unlock) backed by server-side hash / verify Cloud Functions<br>- **Vault** — graph node actions **centralized**: accounts only link in the map, non-account nodes are renamed or deleted from an edit-name dialog, and the map opens at a larger base scale; the **access-denied card** gains a sign-in action across all gated pages<br>- **Real brand logos** — Portal link favicons resolve to Brandfetch brand logos through a proxy Cloud Function, with a favicon fallback<br>- **Vault** — a **Verified** chip in the category overview tallies verified accounts and filters to them; account and connection names are title-cased<br>- **Account** — the danger zone can **remove a forgotten vault passphrase** (vault data kept) so a new one can be set on the next visit<br>- **Language switch** button now reads in the language it switches to<br>- Client **database services deduplicated** via a base-class pull-up refactor<br>- **Vault** — the add-account dialog is now a two-step wizard: choose **Account** or a standalone **email / phone / notes** identifier, then fill it in; non-account identifiers link to another as a **backup** (dashed edge on the map)<br>- **Vault** — account-node brand-icon lookups removed; every node now shows its letter initials<br>- **Account** — new **Cadence** panel sets how long the vault stays unlocked after you leave (always require, a fixed minute window, or until reload); the vault-passphrase delete button greys out until a passphrase is set<br>- **Vault** — graph legend no longer disappears on narrow desktop windows or compact tablets; list-card name, category, and connection chips now align on one edge<br>- **Dropdowns** — option row height and font size now match the trigger field across every dropdown in the app, dialog and page controls alike<br>- **Patch Notes** — component filter dropdown reordered and its option icons realigned<br>- **Reminder** and **Recipe** — grids gain a narrow single-column pagination layout for small screens<br>- **Patch Notes** — the activity heatmap popover now opens on tap for mobile, not just hover<br>- **Vault** — graph nodes and edges settle in with a staggered fade-and-scale entrance when the map first builds; the passphrase gate shows a brief verifying state on submit; list cards grid-align the link count, edit, and delete controls onto the name row with an icon-only edit / done toggle<br>- **Safe-area support** added across the native iOS app, installed web app, and Tauri desktop — dialogs, page headers, and the bottom nav consistently clear the notch, Dynamic Island, and home indicator<br>- **Mobile bottom-nav** — the home tab now highlights correctly as active when on the home page<br>- Sign-in state now updates the Home dashboard immediately instead of requiring an extra navigation to refresh<br>- **Sign-in-method backend selection** — region / country detection removed; username / password signs in via CloudBase (default) and **Google** via Firebase, with Firebase brought to full feature parity (per-user storage, ownership, live stats, Vault passphrase lock, URL proxy) and cross-account sharing kept CloudBase-only<br>- **Entertainment** — a **scrape fallback** fills in a film's rating and first release date when the metadata API returns them empty; films with no rating anywhere now store one consistent value and no longer render as a poor score<br>- **Entertainment** — the movie card's *Type* label now reads **Genre**<br>- **Entertainment** — the activity panel keeps its size and shows a spinner while loading, with a message when there is no history yet<br>- **Account** — the Connections card notes that connections apply to the Reminder page only<br>- **Failed saves no longer report success silently** — every data-layer error is wrapped in a typed error class, so the retry and error dialogs route correctly on both backends<br>- Each page's accent colour is now defined once as an RGB variable and derived from there<br>- **Reminder** — the add button reads *Adding...* and disables while an item saves; the pager no longer lands on an empty page after adding an item that fills the current page, or after removing the last item on a page<br>- **Home** — the dashboard's bilingual activity footer is no longer clipped at the bottom edge<br>- **Home** — counts for the shared public pages (films, recipes, quotes) now read from the global totals, so a per-user copy can no longer shadow them<br>- Due-date and relative-time labels (*Today*, *5m ago*, *3d overdue*) are now localized instead of always rendering in English<br>- The loading-timeout retry dialog no longer appears on a healthy load while sign-in is still resolving — the countdown starts once auth settles, with a max-wait fallback so a genuinely stuck load still surfaces it<br>- **Vault** graph — selecting a node now highlights only its first-degree links, a search greys the dashed backup links that don't touch a match, and adding a node or link no longer flashes the whole graph<br>- **Debt Sonata** — editing an entry gains a **new-cycle** toggle that clears its payment history and resets the balance for a fresh cycle |

---

### 🔧 Ongoing Standards & Maintenance

- Regular security dependency bumps via Dependabot across core packages and Firebase Functions throughout the project lifetime.
- Gitignore and build configuration maintained to prevent sensitive files and large binaries from being committed.
- Project-wide coding-style pass — descriptive naming, typed error classes, access modifiers, `940px` mobile breakpoint, standardised save-spinners, dialog convention alignment, all string literals extracted to constants and locale files, and consistent CSS spacing, section dividers, and method-section ordering across all pages.
- Scrollbar treatment standardised app-wide — panels and dialogs always use the rose app scrollbar, glass-card page containers take their own page accent, and pages without a glass-card keep the browser's native bar.

---

## 🔐 Authentication & Data Backends

The app runs on **one of two independent backends per session**, chosen by *how you sign in*. Both are always initialised so the login page can offer either method; the active data backend is decided at sign-in and persisted for the session.

| Sign-in method | Auth provider | Data backend |
| :--- | :--- | :--- |
| **Username / password** | Tencent CloudBase | **CloudBase** *(default)* |
| **Google** | Firebase Auth | **Firebase** (Realtime Database + Storage) |

> The two datasets are **fully separate** — signing in as the same person two different ways yields two independent datasets. Google sign-in is available on **browser and installed web app only** (mobile & desktop); it is hidden in the desktop (Tauri) and iOS native apps, which are username / password only.

### Feature availability by backend

Everything not listed below behaves **identically** on both backends: movies, reminders, recipes, Portal links, debt, vault, quotes, patch / release notes, Today, activity log, per-user stats & live counters, milestones, preferences, and the Vault passphrase gate.

| Feature | CloudBase (password) | Firebase (Google) | Reason |
| :--- | :---: | :---: | :--- |
| Connected Accounts | ✅ | ❌ *(hidden)* | Cross-account linking is a CloudBase-hosted feature |
| Shared reminders | ✅ | ❌ | Same cross-account limitation |
| Administrator role | ✅ | ❌ *(never)* | Roles are a CloudBase concept |
| Resonance — delete quote | admins only | ❌ | Admin-gated; no admin on Firebase |
| Portal — Date Calculator | admins only | ❌ | Admin-gated |
| Edit / delete **other** users' data | admins only | ❌ *(own data only)* | No admin escalation on Firebase |
| Change password | ✅ | ❌ *(hidden)* | Google accounts have no password |
| Delete-account confirmation | password prompt | Google re-auth popup | Different identity proof |
| Public quote browsing (anonymous) | ✅ | ✅ *(served by CloudBase)* | Shared infrastructure, backend-independent |

### Storage-structure differences

| Aspect | CloudBase | Firebase Realtime Database |
| :--- | :--- | :--- |
| Database type | Document / collection store with server-side queries | JSON tree — reads fetch a collection and filter **client-side** |
| Ownership field | `_openid` *(auto-stamped by the platform)* | native `uid` *(surfaced to the app as `_openid` in memory on read)* |
| Per-user document | `users` collection — one document per user | `users/<uid>` node |
| Date calculator | per-owner rows in a shared collection | own path `date_calculator/<uid>` |
| Vault passphrase hashes | CloudBase Cloud Functions + collection | `passphrase_locks/<uid>` via Firebase Functions *(client sees booleans only)* |
| Movie images | Tencent COS + CDN | Firebase Storage |
| URL proxy (Portal RSS / titles) | Express endpoint + `fetchUrl` function | `proxyFetch` callable Cloud Function |

The **RTDB "no server-side queries"** point is the only one with a practical edge: Firebase reads pull a whole collection and filter in the client — fine at personal scale, but it would matter at large scale.

---

## 📁 Project Structure

```text
src/app/
├── app.component.*           # Root shell — navigation drawer + router outlet
├── app.config.ts             # Application bootstrapping and provider setup
├── app.config.server.ts      # SSR-specific configuration
├── app.routes.ts             # Top-level route definitions
│
├── backend/                  # Service layer
│   ├── authentication-service/   # Firebase + Cloudbase auth abstraction
│   ├── database-service/         # Unified database interface (dual-backend)
│   ├── dialog-service/           # Global dialog management
│   ├── douban-service/           # Douban API proxy client
│   ├── notification-service/     # Web push notification subscription management
│   └── vault-access-service/     # Vault passphrase-gate cadence — tracks the unlock grace window
│
├── common/                   # Shared utilities and value objects
│   ├── locale/                   # Locale strings — locale.en.ts (EN), locale.zh.ts (ZH), locale-strings.ts (active-locale barrel)
│   ├── app.logs.ts               # Logging helpers
│   ├── blocked-card/             # Reusable full-screen blocked card (access denied, mobile gate)
│   ├── click-outside/            # Shared clickOutside directive for closing dropdowns and popovers
│   ├── error/                    # Shared typed error classes (instanceof-routable)
│   ├── passphrase-lock/          # Shared passphrase entry / verify UI used by the Vault gate
│   ├── timeout/                  # Loading timeout service and tests
│   └── utilities/                # General utility functions and tests
│
└── fontend/                  # Feature pages (all standalone components)
    ├── home/                     # Vision Home dashboard
    ├── today/                    # Daily planner — drag-to-create time blocks, live tracking
    ├── entertainment/            # Entertainment tracking hub
    ├── reminder/                 # Expense and date reminder tables
    ├── portal/                   # AI search hub
    ├── recipe/                   # Personal cookbook vault
    ├── resonance/                # Quote vault
    ├── debt/                     # Debt Sonata — debt tracking canvas
    ├── patch/                    # Patch notes / internal dev log
    ├── about/                    # Professional history timeline
    ├── account/                  # Account management hub (identity, stats, milestones, danger zone)
    ├── vault/                    # Vault — account links force-directed graph
    ├── desktop-context-menu/     # Right-click overlay menu (desktop app only)
    ├── mobile-bottom-nav/        # Bottom nav bar component and data
    └── login/                    # Authentication entry point
```

---

## 🏗 Tech Stack

### Frontend

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `@angular/core` | ^21.x | Core framework |
| `@angular/router` | ^21.x | Client-side routing |
| `@angular/forms` | ^21.x | Reactive and template-driven forms |
| `@angular/animations` | ^21.x | Animation engine |
| `@angular/ssr` | ^21.x | Server-side rendering |
| `@angular/material` | ^21.x | UI components (drawer, buttons, ripple) |
| `@angular/cdk` | ^21.x | Component Dev Kit primitives |
| `primeng` | ^21.x | Advanced UI (tables, dialogs, toast, calendar) |
| `@primeuix/themes` | ^2.x | PrimeNG design tokens and theming |
| `@primeuix/utils` | ^0.x | PrimeNG design-token utility helpers |
| `primeicons` | ^7.x | PrimeNG icon set |
| `gsap` | ^3.x | Animation library for smooth UI transitions |
| `rxjs` | ~7.8.x | Reactive streams and async data flows |
| `date-fns` | ^4.x | Date formatting and calculations |
| `@angular/service-worker` | ^21.x | PWA service worker for offline support |
| `@capacitor/core` | ^8.x | Native iOS / Android packaging |
| `@capacitor/ios` | ^8.x | iOS native project shell for Capacitor packaging |
| `@tauri-apps/api` | ^1.x | Tauri JS API for window, clipboard, and system access |
| `@tauri-apps/cli` | ^1.x | Desktop app bundler (macOS / Windows / Linux) |

### Backend & Services

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `firebase` | ^12.x | Auth, Realtime Database, Cloud Functions, Storage |
| `@cloudbase/js-sdk` | ^3.x | Tencent CloudBase — default auth + database backend (username / password) and image CDN |
| `@cloudbase/types` | ^3.x | Cloudbase TypeScript type definitions |
| `http-proxy-middleware` | ^3.x | Proxy layer for Douban API calls |

---

## 📋 Prerequisites

Ensure the following are installed before running the project:

| Requirement | Minimum Version |
| :--- | :--- |
| **Node.js** | 18.x or higher |
| **npm** | 9.x or higher |
| **Angular CLI** | 21.x (`npm install -g @angular/cli`) |

You will also need credentials for:

- **Firebase project** — Authentication (Google sign-in), Realtime Database, Cloud Functions, and Storage; backs Google-signed-in sessions.
- **Tencent CloudBase** — environment ID for the **default** backend (username / password sign-in and the image CDN).

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Soucieux/Angular-Accomplishment.git
cd Angular-Accomplishment
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the environment template and populate it with your credentials:

```bash
cp src/environment/environment-template.ts src/environment/environment.ts
```

Open `src/environment/environment.ts` and fill in your CloudBase `envId` (the default username / password backend) and your Firebase config object (Google sign-in + the Firebase backend). Set `authDomain` to the domain that serves the app.

### 4. Start the development server

```bash
ng serve
```

Navigate to `http://localhost:4200`. The application reloads automatically on file changes.

### 5. Deploy

The live site is served by **Firebase Hosting**; the Firebase backend also carries Cloud Functions and Realtime Database security rules, so all three targets are deployed together:

```bash
ng build
firebase deploy --only functions,database,hosting
```

| Target | What it deploys |
| :--- | :--- |
| `functions` | Vault passphrase-lock callables + the `proxyFetch` URL proxy |
| `database` | `database.rules.json` — RTDB security rules (the `passphrase_locks` deny keeps hashes unreadable by clients) |
| `hosting` | The built Angular app |

> **Google sign-in setup** (one-time, in the Firebase console): enable the **Google** sign-in provider, keep the serving domain in **Authentication → Authorized domains**, and set `authDomain` in `environment.ts` to that same serving domain — Chrome M115+ blocks the sign-in flow when it differs.

---

*This is a private project and is not open for external contributions.*
