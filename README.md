# 🌌 Vision Canvas

> A private, self-designed personal management suite built with **Angular 21** — centralizing entertainment tracking, financial reminders, development logging, and daily life analytics in one cohesive, secure interface.

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![Firebase](https://img.shields.io/badge/Firebase-11-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Cloudbase](https://img.shields.io/badge/Tencent_Cloudbase-2.x-00A3FF)](https://cloudbase.net)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-20-7C3AED)](https://primeng.org)
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
| **Vision Home** | Bento-grid dashboard with live stat chips, Life Clock (year/month/week/day progress), Pomodoro Focus Timer, recent activity log, week calendar, and quick-action shortcuts. | Active |
| **Entertainment Hub** | Track movies and TV dramas with Douban API metadata lookup, Firebase/Cloudbase image management, category filtering, favourites, rating system, and full addition/deletion history. | Stable |
| **Reminder Suite** | Triple-table system — date calculator, account expense tracker, and bank debt ledger — with colour-coded status indicators and persistent cloud sync. | Active |
| **Nexus** | Personal AI search hub with chip-based query filters and a saved link management panel. | Beta |
| **Resonance** | Personal quote vault with author attribution, timestamps, and anonymous browsing support. | Active |
| **Recipe Vault** | Personal cookbook with category filtering, ingredient groups with type badges, step-by-step instructions, and a live servings scaler. Each category applies a distinct colour theme (rose · green · purple · amber · pink) across cards, panels, and action buttons. Ingredient names support both Chinese characters and English — enter each language on a separate line; the first line is used as the coloured pill label shown on the right side of steps. | Active |
| **Patch Notes** | Internal development log with add/edit/delete, bug flagging per component, status filters, and pagination. | Active |
| **Secure Entry** | Auth page with Google Sign-In, email/password login, and user sign-up — with route guards protecting all authenticated pages. | Stable |
| **About** | Professional history timeline with animated visual background. | Stable |

---

## ⏳ Development Timeline

*Reconstructed from 300+ meaningful commits across the project history.*

### 🏗 R0 — Scaffolding (January 2024 – September 2024)

| Period | Milestone |
| :--- | :--- |
| **January 2024** | Angular workspace initialized; initial project scaffolding and directory structure established. |
| **February 2024** | Basic component skeletons created; navigation drawer shell added; routing stubs and home icon configured; multiple project setup iterations committed. |
| **June 2024** | Navigation drawer and home page icon added; client-side router fully configured; page transition animations implemented; Google Fonts and Material Symbols icon set integrated; first wave of Dependabot security dependency bumps merged. |
| **July 2024** | Firebase Hosting deployment pipeline established; build scripts configured; structural fixes applied; a failed deployment reverted and re-applied cleanly. |
| **September 2024** | Firebase project connected; user authentication initialized; Firestore database provisioned with initial collection schema. |

---

### 🚀 R1 — Feature Development (February 2025 – May 2026)

| Period | Milestone |
| :--- | :--- |
| **February 2025** | Firestore database and Home page scaffolded. Entertainment Hub initialized — TV Shows grid layout built; Douban API proxy server configured to bypass CORS; Firebase Storage image retrieval pipeline established; movie data model refactored; image upload to Firebase implemented; server-side API call issues resolved. |
| **March 2025** | Full mobile layout for iPhone 16 Pro and Samsung Galaxy; genre category chip system with dynamic counts per category; per-card entrance animations; access-denied page for unauthenticated users; cancel-search button added; delete-movie button per card; login and logout integrated directly into Entertainment; multiple Firebase Cloud Function instances deployed for parallel image serving; complete visual overhaul with new colour palette, typography, and card design language. |
| **June 2025** | PrimeNG dialog and message service compatibility conflict resolved; movie list state management bug fixed when adding a new entry to an existing list. |
| **September 2025** | Add-movie dialog built with live Douban metadata search, real-time cover image preview, and submit-disable guard before results arrive; image and metadata upload to Firebase Storage and Firestore; cascading Storage deletion on movie removal; statistics chip updated after deletion; movie list sorted by first release date; security dependency bumps via Dependabot. |
| **October 2025** | Error dialogs added for network failures and invalid movie ID searches; confirmation dialog for destructive retrieval actions; `openDialog` constructors overloaded to support add, error, and restore use cases; animated progress bar in the upload flow; history dialog initialized to log all add operations; `*ngIf` / `*ngFor` legacy directives migrated across the entire codebase to Angular 17+ `@if` / `@for` control-flow syntax; Angular SSR dependency bumped. |
| **November 2025** | Login page initialized; email and password sign-in integrated; route guard added to redirect already-logged-in users away from the login page; post-login redirect to last-visited route; mobile-responsive login layout across two adjustment passes; logout button repositioned into the navigation drawer; website title and icon updated globally; home page slogan and layout refreshed; Entertainment add-dialog and history dialog refined with font and button-group updates. |
| **December 2025** | Entertainment Hub: favourite/unfavourite toggle added per movie; colour-coded rating-change indicators (rate up / rate down); search dialog improved with template-variable binding and stop-searching control; all dialogs made fully mobile-compatible; history dialog updated to record deletion metadata. Patch Notes module launched: login guard applied; expandable table rows scoped per component; status dropdown (Active / Resolved); full add, edit, and delete flow with dedicated dialogs; skeleton shown only during data fetch; mobile-compatible table layout; bug-flag checkbox per entry. |
| **January 2026** | About page launched with animated gradient background and interactive professional history timeline; mobile-compatible layout. Patch Notes pagination introduced — rowspan correctly recalculated after date-column sorting; letter capitalisation bug fixed; adding a new entry no longer resets to page 1. Reminder module fully built across all three tables in a single sprint: date calculator (Firestore persistence, skeleton loader, reset, colour-coded save indicators); account expense ledger (per-cell inline editing, checkbox confirmation flow, skeleton); bank debt tracker (paginator, mobile popover tooltips, external link management, delete flow with confirmation, colour-coded overdue/active status). |
| **February 2026** | Genre editing feature added to Entertainment — users can reassign a movie to a different genre post-upload; isFavourite feature refined with improved state handling; second Entertainment mobile compatibility pass; minor bug fixes across modules; package dependencies updated. |
| **March 2026** | Abstract base class introduced to unify Firebase and Tencent Cloudbase under a shared service API contract; dynamic backend package loading based on detected user region at startup; `_openid` ownership field recorded on every Firestore and Cloudbase document; admin vs. regular user permission model enforced across all modules; CN-region login via Tencent Cloudbase credentials; Reminder module fully ported to the new permission model; country detection added on app startup; error propagation added to all write and update calls; mixed `await` / `.then()` usage resolved for consistency across Firebase service; application-wide constants extracted to a dedicated `app.constant.ts`; login state removed from local storage; multiple security and framework dependency bumps via Dependabot. |
| **April 2026** | Entertainment images migrated from Firebase Storage to Tencent Cloudbase CDN for CN-region performance; Reminder currency icon updated to correct locale symbol; disabled-cell field feature removed from Reminder; IP-lookup feature removed; SSRF security vulnerability identified and patched; multiple security dependency bumps merged. |
| **May 2026** | Seven sequential UI style passes applied across the entire application (Parts I–VII): Entertainment card layout and dialog polish; Home dashboard spacing and chip sizing; Patch Notes filter icon and bug checkbox overrides; Reminder table density and cell alignment; global navigation drawer refinements. PrimeNG component overrides, colour tokens, and spacing systematically tightened throughout all passes. |
| **May 2026** | Vision Home bento-grid dashboard launched — live stat chips (movies, reminders, quotes, patches); Life Clock with real-time year / month / week / day progress bars; Pomodoro Focus Timer with preset durations; Quick Note scratch pad; recent activity feed in a 2-column grid; week calendar with task pills; quick-action shortcut row; mobile-responsive layout. Login page entrance animations added. Sign-up flow completed — new users can register directly from the login page. |
| **May 2026** | Recipe Vault module launched — personal cookbook with list, detail, and editor views; ingredient groups with type classification and colour-coded badges; live servings scaler; step-by-step instructions with ingredient pill highlights; category chip filtering; drag-to-reorder steps; notes and tips section; skeleton loading states. |
| **May 2026** | Resonance module launched — personal quote vault with author attribution, ISO timestamps, and anonymous browsing support; anonymous-user refresh race condition identified and patched. Nexus module built out — AI search hub with chip-based category filters, search history, and a saved link management panel with add and delete flows. Search feature added to Entertainment with a dedicated search dialog and block-dialog state; movie deletion flow ported to Cloudbase. Cloudbase authentication race condition on app startup resolved. Full JSDoc documentation and access modifier pass across all services and components. Environment template added for safer onboarding. Bundle size budget increased; error message and exception handling refactored globally. |

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
| `@angular/material` | ^20.x | UI components (drawer, buttons, ripple) |
| `@angular/cdk` | ^20.x | Component Dev Kit primitives |
| `primeng` | ^20.x | Advanced UI (tables, dialogs, toast, calendar) |
| `@primeng/themes` | ^20.x | PrimeNG design tokens and theming |
| `primeicons` | ^7.x | PrimeNG icon set |
| `bootstrap` | ^5.3.x | Grid system and utility classes |
| `rxjs` | ~7.8.x | Reactive streams and async data flows |
| `date-fns` | ^4.x | Date formatting and calculations |

### Backend & Services

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `firebase` | ^11.x | Auth, Firestore, Cloud Functions, Storage |
| `@angular/fire` | ^20.x | Angular Firebase SDK integration |
| `@cloudbase/js-sdk` | ^2.x | Tencent Cloudbase (CN region auth and storage) |
| `@cloudbase/types` | ^2.x | Cloudbase TypeScript type definitions |
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
cp src/environments/environment.template.ts src/environments/environment.ts
```

Open `src/environments/environment.ts` and fill in your Firebase config object and, if applicable, your Cloudbase `envId`.

### 4. Start the development server

```bash
ng serve
```

Navigate to `http://localhost:4200`. The application reloads automatically on file changes.

---

*This is a private project and is not open for external contributions.*
