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
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)

---

## ✨ Core Features

| Module | Description | Status |
| :--- | :--- | :---: |
| **Today** | Daily planner and time-blocking canvas.<br>- **Drag-to-create** timed blocks on an hour-grid calendar<br>- **Drag-to-move** for repositioning existing blocks<br>- **Resize handles** to adjust block duration<br>- Quick-add lane for untimed tasks with keyboard confirm<br>- **Live tracking** session with elapsed timer<br>- Current-time indicator scrolled into view on open<br>- Reminder items shown in a dedicated lane — injected live from the Reminder module and refreshed at midnight | Beta |
| **Home** | **Orbital dashboard** built around a *Life Clock* displaying the current time in real-time.<br>- Concentric progress rings for **year, month, week, and day**<br>- **Satellite stat discs** with live counts for movies, patch notes, quotes, and recipes<br>- Glass widget panels: upcoming reminders, debt payments, recent activity, entertainment genre breakdown, a recipe list, and saved link chips<br>- **Week agenda** view and quick-action pill buttons<br>- Fully responsive mobile layout | Active |
| **Entertainment** | Media tracker for **movies and TV dramas** with rich metadata support.<br>- **Douban API** lookup for title, genre, cast, and cover image<br>- Firebase / Cloudbase image storage and CDN delivery<br>- Category filtering, favourites toggle, and **colour-coded rating indicators**<br>- Full add / deletion history with timestamps | Stable |
| **Reminder** | Account expense tracker with real-time cloud sync.<br>- **Inline cell editing** with keyboard confirm flow<br>- Colour-coded active, overdue, and paid-off status indicators<br>- **Start / end time slots** — optional HH:MM time range per item with auto-computed end offset<br>- **Per-card delete button** for quick single-item removal<br>- **Shared reminders** — items marked shared appear on connected accounts in real time, with a shared-only filter chip and creator badges<br>- Persistent per-user state | Active |
| **Portal** | Personal AI search hub and link manager.<br>- **Chip-based category filters** for AI tool discovery with category management dialog<br>- Saved link management with category assignment and logo auto-fetch<br>- **Date Calculator** — date-range arithmetic with CloudBase persistence; collapsible via header click<br>- Shared link flag to distinguish personal from shared entries<br>- Fallback colour avatars when logo fetch fails | Beta |
| **Debt Sonata** | Debt tracking canvas with full payment history.<br>- **Card-based ledger** supporting CNY and CAD currencies<br>- Preset and custom **payment chips** with per-card progress bar<br>- Paid-off ribbon state and coral card styling<br>- Summary card with per-currency totals<br>- Full payment history timeline per entry | Active |
| **Resonance** | Personal quote vault.<br>- Author attribution and timestamps<br>- **Anonymous browsing** support for public quotes<br>- Ownership-based edit and delete permissions | Active |
| **Recipe** | Personal cookbook with per-category colour theming.<br>- List, detail, and editor views<br>- **Ingredient groups** with type badges and bilingual name support *(Chinese + English)*<br>- Live **servings scaler** and step-by-step instruction view<br>- Category colour themes — *rose · green · purple · amber · pink*<br>- Drag-to-reorder steps | Active |
| **Patch Notes** | Internal development log with two views.<br>- *Patch Notes* — add, edit, and delete entries per component; bug flag per entry; status filter (Active / Resolved); paginated with correct rowspan recalculation after date sorting<br>- **Activity heatmap** popover on the stats strip — monthly entry counts across years with intensity bands and locale-aware month labels<br>- *Release Notes* — versioned release cards with section headings, badge chips, and summaries | Active |
| **Account** | Personal account management hub with navy sky theme.<br>- Identity card — username editing and email display with verified badge<br>- Password change with strength meter and visibility toggle<br>- **Second Brain stats** — live counts for movies, reminders, debts, and recipes<br>- Milestone timeline with connector lines and colour-coded dates<br>- **Connected Accounts** — link another account by share code, approve or decline requests, and unlink or re-connect; shares reminders with linked accounts<br>- Danger zone card for account deletion with confirmation guard | Active |
| **Login** | Authentication entry point.<br>- **Google Sign-In** and email / password login<br>- Sign-up flow for new user registration<br>- Route guards protecting all authenticated pages<br>- Post-login redirect to last-visited route<br>- Sidebar presence row: avatar, online status, and account menu popover | Stable |
| **About** | Professional history timeline.<br>- Interactive milestone entries<br>- **Animated gradient background** | Stable |
| **Vault** | Account links graph with a **Slate Steel** theme.<br>- **Force-directed graph** of accounts (app-tile nodes, coloured by category), emails (circles), phones (diamonds), and links (hexagons)<br>- **Click-to-trace** — highlights linked nodes by hop distance (direct / second-degree) and dims the rest; drag, pan, and zoom<br>- **Category overview** chips; the **legend doubles as a type filter** — click a type (or Verified) to isolate it, click again to clear<br>- **Add-account dialog** with inline custom categories and multi-connection wiring; **link-mode** to connect nodes by hand<br>- List view with inline link editing and **inline category assignment**; per-user CloudBase persistence | Beta |

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
| **July 2026** | - **Connected Accounts** launched — link another account by share code with an approve / decline request flow; per-user adjacency model so each account sees only its own connections' shared items, with unlink and re-connect handling<br>- **Shared reminders** — items marked shared surface on connected accounts in real time (admin read Cloud Function plus a `sharedRev` signal on each user's own document, working around CloudBase watch not pushing other users' documents); shared-only filter chip and creator badges on the Reminder page<br>- Connected accounts' shared activity merged into the **Home** recent-activity feed<br>- **Portal** links gain a shared flag with an optional category<br>- **Vault** placed behind an authentication guard; **Patch Notes** opened to public access<br>- **Vault graph** — the legend now doubles as a type filter (click a type or *Verified* to isolate, click again to clear); accounts gain inline category assignment; link (hexagon) nodes added<br>- **Portal favicons** proxied through a Firebase function so icons load on CN networks<br>- **Today** — short tracked records (under 15 min) reveal their time range on hover |

---

### 🔧 Ongoing Housekeeping (Continuous)

- Regular security dependency bumps via Dependabot across core packages and Firebase Functions throughout the project lifetime.
- Gitignore and build configuration maintained to prevent sensitive files and large binaries from being committed.
- Project-wide coding-style pass — descriptive naming, typed error classes, access modifiers, `940px` mobile breakpoint, standardised save-spinners, and dialog convention alignment across all pages.

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
│   └── notification-service/     # Web push notification subscription management
│
├── common/                   # Shared utilities and value objects
│   ├── locale/                   # Locale strings — locale.en.ts (EN), locale.zh.ts (ZH), locale-strings.ts (active-locale barrel)
│   ├── app.logs.ts               # Logging helpers
│   ├── blocked-card/             # Reusable full-screen blocked card (access denied, mobile gate)
│   ├── error/                    # Shared typed error classes (instanceof-routable)
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
| `primeicons` | ^7.x | PrimeNG icon set |
| `gsap` | ^3.x | Animation library for smooth UI transitions |
| `rxjs` | ~7.8.x | Reactive streams and async data flows |
| `date-fns` | ^4.x | Date formatting and calculations |
| `@angular/service-worker` | ^21.x | PWA service worker for offline support |
| `@capacitor/core` | ^8.x | Native iOS / Android packaging |
| `@tauri-apps/api` | ^1.x | Tauri JS API for window, clipboard, and system access |
| `@tauri-apps/cli` | ^1.x | Desktop app bundler (macOS / Windows / Linux) |

### Backend & Services

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `firebase` | ^12.x | Auth, Firestore, Cloud Functions, Storage |
| `@cloudbase/js-sdk` | ^3.x | Tencent Cloudbase (CN region auth and storage) |
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

- **Firebase project** — Authentication, Firestore database, Cloud Functions, and Storage bucket.
- **Tencent Cloudbase** *(optional — required for CN-region users)* — environment ID and secret for region-based auth and image CDN.

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

Open `src/environment/environment.ts` and fill in your Firebase config object and, if applicable, your Cloudbase `envId`.

### 4. Start the development server

```bash
ng serve
```

Navigate to `http://localhost:4200`. The application reloads automatically on file changes.

---

*This is a private project and is not open for external contributions.*
