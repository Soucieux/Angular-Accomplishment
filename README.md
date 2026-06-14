# 🌌 Vision Canvas

> A private, self-designed personal management suite built with **Angular 21** — centralizing entertainment tracking, financial reminders, development logging, and daily life analytics in one cohesive, secure interface.

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Cloudbase](https://img.shields.io/badge/Tencent_Cloudbase-3.x-00A3FF)](https://cloudbase.net)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-21-7C3AED)](https://primeng.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

---

## Table of Contents

- [Overview](#overview)
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
| **Vision Home** | Orbital dashboard centred on a Life Clock displaying real-time hour, minute, and second with concentric progress rings for year, month, week, and day. Satellite stat discs show live counts for movies, patch notes, quotes, and recipes. Glass widget panels surface upcoming reminders, debt payments, recent activity, entertainment genre breakdown, a recipe list, saved link chips, and a week agenda — all reachable via quick-action pill buttons. | Active |
| **Entertainment Hub** | Track movies and TV dramas with Douban API metadata lookup, Firebase/Cloudbase image management, category filtering, favourites, rating system, and full addition/deletion history. | Stable |
| **Reminder Suite** | Account expense tracker with inline editing, colour-coded status indicators, and persistent cloud sync. | Active |
| **Nexus** | Personal AI search hub with chip-based query filters, a saved link management panel, and an integrated Date Calculator for date-range arithmetic. | Beta |
| **Debt Sonata** | Debt tracking canvas — card-based ledger with CNY/CAD currency, payment chips, progress bars, paid-off ribbon, summary totals, and a full payment history timeline per entry. | Active |
| **Resonance** | Personal quote vault with author attribution, timestamps, and anonymous browsing support. | Active |
| **Recipe Vault** | Personal cookbook with category filtering, ingredient groups with type badges, step-by-step instructions, and a live servings scaler. Each category applies a distinct colour theme (rose · green · purple · amber · pink) across cards, panels, and action buttons. Ingredient names support both Chinese characters and English — enter each language on a separate line; the first line is used as the coloured pill label shown on the right side of steps. | Active |
| **Patch Notes** | Internal development log with add/edit/delete, bug flagging per component, status filters, and pagination. | Active |
| **Secure Entry** | Auth page with Google Sign-In, email/password login, and user sign-up — with route guards protecting all authenticated pages. Sidebar features a presence row with avatar, online status, and an account menu popover (desktop) or confirm dialog (mobile). | Stable |
| **About** | Professional history timeline with animated visual background. | Stable |

---

## ⏳ Development Timeline

*Reconstructed from 300+ meaningful commits across the project history.*

### 🏗 R0 — Scaffolding (January 2024 – September 2024)

| Period | Milestone |
| :--- | :--- |
| **January 2024** | - Angular workspace initialized; project scaffolding and directory structure established |
| **February 2024** | - Basic component skeletons created<br>- Navigation drawer shell added with routing stubs and home icon<br>- Multiple project setup iterations committed |
| **June 2024** | - Navigation drawer and home page icon added<br>- Client-side router fully configured with **page transition animations**<br>- Google Fonts and Material Symbols icon set integrated<br>- First wave of Dependabot security dependency bumps merged |
| **July 2024** | - **Firebase Hosting** deployment pipeline established<br>- Build scripts configured; a failed deployment reverted and re-applied cleanly |
| **September 2024** | - Firebase project connected; **user authentication** initialized<br>- Firestore database provisioned with initial collection schema |

---

### ✅ R1 — Feature Development (February 2025 – June 2026) · Completed

| Period | Milestone |
| :--- | :--- |
| **February 2025** | - Firestore database and Home page scaffolded<br>- **Entertainment Hub** initialized — TV Shows grid layout built<br>- Douban API proxy server configured to bypass CORS<br>- Firebase Storage image retrieval pipeline established<br>- Movie data model refactored; image upload to Firebase implemented |
| **March 2025** | - **Full mobile layout** for iPhone 16 Pro and Samsung Galaxy<br>- Genre category chip system with dynamic counts per category<br>- Per-card entrance animations; access-denied page for unauthenticated users<br>- Login and logout integrated directly into Entertainment<br>- Multiple Firebase Cloud Function instances deployed for **parallel image serving**<br>- Complete visual overhaul — new colour palette, typography, and card design language |
| **June 2025** | - PrimeNG dialog and message service compatibility conflict resolved<br>- Movie list state management bug fixed when adding a new entry to an existing list |
| **September 2025** | - **Add-movie dialog** built with live Douban metadata search, real-time cover preview, and submit-disable guard<br>- Image and metadata upload to Firebase Storage and Firestore<br>- Cascading Storage deletion on movie removal; statistics chip updated after deletion<br>- Movie list sorted by first release date |
| **October 2025** | - Error dialogs for network failures and invalid movie ID searches<br>- Confirmation dialog for destructive retrieval actions; animated progress bar in the upload flow<br>- History dialog initialized to log all add operations<br>- **`*ngIf` / `*ngFor` fully migrated** to Angular 17+ `@if` / `@for` control-flow syntax across the entire codebase |
| **November 2025** | - **Login page** built with email/password sign-in and route guard<br>- Post-login redirect to last-visited route; mobile-responsive login layout<br>- Logout button repositioned into the navigation drawer<br>- Website title and icon updated globally; home page slogan refreshed |
| **December 2025** | - Entertainment: favourite/unfavourite toggle; **colour-coded rating indicators** (up / down); all dialogs made fully mobile-compatible; history dialog records deletion metadata<br>- **Patch Notes** module launched — expandable table rows per component; status dropdown (Active / Resolved); full add/edit/delete flow with dedicated dialogs; bug-flag checkbox per entry |
| **January 2026** | - **About** page launched with animated gradient background and interactive professional history timeline<br>- Patch Notes: pagination with correct rowspan recalculation after date sorting<br>- **Reminder** module built across three tables in a single sprint:<br>  &nbsp;&nbsp;• *Date Calculator* — Firestore persistence, reset, colour-coded save indicators<br>  &nbsp;&nbsp;• *Account Expense Ledger* — per-cell inline editing, checkbox confirmation flow<br>  &nbsp;&nbsp;• *Bank Debt Tracker* — paginator, mobile tooltips, delete flow, overdue/active colour states |
| **February 2026** | - Genre editing added to Entertainment — reassign a movie to a different genre post-upload<br>- isFavourite feature refined with improved state handling<br>- Second Entertainment mobile compatibility pass; package dependencies updated |
| **March 2026** | - **Abstract base class** introduced to unify Firebase and Tencent Cloudbase under a shared service API<br>- **Dual-backend dynamic loading** based on detected user region at startup<br>- `_openid` ownership field on every document; admin vs. regular user permission model enforced across all modules<br>- CN-region login via Tencent Cloudbase credentials; country detection at startup<br>- Application-wide constants extracted to `app.constant.ts`; login state removed from local storage |
| **April 2026** | - Entertainment images migrated to **Tencent Cloudbase CDN** for CN-region performance<br>- **SSRF security vulnerability** identified and patched<br>- Reminder currency icon updated; disabled-cell field and IP-lookup features removed |
| **May 2026** | - Seven sequential UI style passes (Parts I–VII) across the entire app — Entertainment, Home, Patch Notes, Reminder, and global navigation systematically polished<br>- **Vision Home** orbital dashboard launched: *Life Clock* with real-time display and concentric year / month / week / day progress rings; satellite stat discs; quick-action pill buttons; mobile-responsive layout<br>- Login page entrance animations added; **sign-up flow** completed for new user registration<br>- **Recipe Vault** launched: personal cookbook with list / detail / editor views; ingredient groups with type classification and colour-coded badges; live servings scaler; step-by-step instructions; category chip filtering; drag-to-reorder steps<br>- **Resonance** module launched: personal quote vault with author attribution, timestamps, and anonymous browsing support<br>- **Nexus** module built: AI search hub with chip-based category filters, search history, and saved link management panel<br>- Search feature added to Entertainment with dedicated search dialog<br>- Full JSDoc documentation and access modifier pass across all services and components; environment template added for safer onboarding |
| **June 2026** | - **Debt Sonata** page launched: card-based debt ledger with CNY / CAD currency; preset and custom payment chips; paid-off ribbon; summary card with per-currency progress bars; all edits routed through dialogs<br>- Date Calculator extracted from Reminder and integrated into **Nexus**<br>- Sidebar account row redesigned — *desktop* popover with avatar, name, online status, sign-out; *mobile* collapses to a confirm dialog<br>- Ownership-based permission checks added across Entertainment, Resonance, and Nexus<br>- **Three-mode navigation**: desktop (≥1300px) collapsible side drawer; compact overlay (941–1300px) with floating hamburger and full-width backdrop; mobile (≤940px) bottom nav bar<br>- Account actions (avatar, online status, sign-out) added to the **mobile bottom nav**<br>- Vision Home expanded with new panels: week calendar, activity feed, debt tracker, recipe list, quick-access link chips; concentric ring sizing made responsive<br>- **PWA support** added — installable on iOS and Android with web manifest, themed status bar, and safe-area insets for notched devices<br>- **Web push notifications** — users subscribe via the account popover; daily digest fires at 09:00 CST via CloudBase scheduled function; subscription state stored per-user, cleared on sign-out |

---

### 🚀 R2 — Polish & Refinement (June 2026 – Present)

| Period | Milestone |
| :--- | :--- |
| **June 2026** | - Phase R2 begins — R1 feature set complete and stable |

---

### 🔧 Ongoing Housekeeping (Continuous)

- Regular security dependency bumps via Dependabot across core packages and Firebase Functions throughout the project lifetime.
- Gitignore and build configuration maintained to prevent sensitive files and large binaries from being committed.

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
│   └── douban-service/           # Douban API proxy client
│
├── common/                   # Shared utilities and value objects
│   ├── app.constant.ts           # Application-wide constants
│   ├── app.logs.ts               # Logging helpers
│   ├── app.utilities.ts          # General utility functions
│   ├── movieitem.vo.ts           # Movie value object definition
│   └── error/                    # Shared error UI components
│
└── fontend/                  # Feature pages (all standalone components)
    ├── home/                     # Vision Home dashboard
    ├── entertainment/            # Entertainment tracking hub
    ├── reminder/                 # Expense and date reminder tables
    ├── nexus/                    # AI search hub
    ├── recipe/                   # Personal cookbook vault
    ├── resonance/                # Quote vault
    ├── patch/                    # Patch notes / internal dev log
    ├── about/                    # Professional history timeline
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
| `bootstrap` | ^5.3.x | Grid system and utility classes |
| `rxjs` | ~7.8.x | Reactive streams and async data flows |
| `date-fns` | ^4.x | Date formatting and calculations |

### Backend & Services

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `firebase` | ^12.x | Auth, Firestore, Cloud Functions, Storage |
| `@angular/fire` | ^20.x | Angular Firebase SDK integration |
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
