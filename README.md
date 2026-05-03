# 🌌 VISION CANVAS: Angular-Accomplishment

A self-designed, private management suite built with **Angular** to bridge the gap between daily entertainment tracking, personal task management, and professional history archiving.

> **Note:** This is a private space designed for personal data sovereignty and centralized life organization.

---

## ⏳ Development Timeline
*Note: This timeline reflects the granular evolution of the project across 415+ commits.*

### 🚀 2024: The Architectural Foundation
* **2024.02**: Initial project scaffolding; core routing and theme setup.
* **2024.03 - 2024.04**: **Firebase Integration** for Auth and Real-time Database.
* **2024.05 - 2024.06**: Development of the **About Module** (Professional History logic).
* **2024.07 - 2024.08**: Implementation of Route Guards and Secure Entry points.
* **2024.09 - 2024.10**: Dashboard UI prototyping and layout refactoring.
* **2024.11 - 2024.12**: Security hardening and identity verification logic.

### 🛠️ 2025: Feature Expansion & Utility Systems
* **2025.01**: Launch of the **Entertainment Module**; Movie Card UI implementation.
* **2025.02 - 2025.03**: **Douban API lookup** and metadata restoration logic.
* **2025.04 - 2025.05**: Introduction of the **Reminder System** and Expense Tables.
* **2025.06 - 2025.07**: Expansion of Reminders: **Debt Tracking** & Date Utilities.
* **2025.08 - 2025.09**: **Patch Notes** module for internal bug/task tracking.
* **2025.10 - 2025.11**: Advanced filtering logic for categorized collections.
* **2025.12**: Optimization of PrimeNG data tables and state management.

### 🎨 2026: Optimization & Vision Refinement
* **2026.01 - 2026.02**: **Hybrid Backend Migration**: Integrated **Cloudbase** for asset storage.
* **2026.03**: Framework upgrade to **Angular 19** and RxJS stream refactoring.
* **2026.04**: Launch of **Vision Home** with animated visual effects and bilingual quotes.
* **2026.05 (Current)**: Refinement of page-blur aesthetics and UI responsiveness.

---

## ✨ Core Features

| Feature | Functionality | Status |
| :--- | :--- | :--- |
| **Entertainment Hub** | Track movies/dramas with Douban lookup & history restoration. | **Stable** |
| **Reminder Suite** | Triple-table system for date calculations, expenses, and tasks. | **Refining** |
| **Vision Home** | Animated landing page with bilingual quotes and visual effects. | **Updated** |
| **Patch Notes** | Internal development log tracking changes and bug status. | **Active** |
| **Secure Entry** | Form validation, verification codes, and Google Sign-In. | **Stable** |

---

## 🏗 System Architecture
* **Firebase**: Primary engine for authentication, data storage, and hosting.
* **Cloudbase**: Optimized image retrieval and supplemental storage.
* **RxJS**: Reactive data flows between the hybrid backend and UI.

---

## 🚀 Getting Started & Prerequisites

### Required Environment
* **Node.js**: v18.13.0+ | **Angular CLI**: v19.x | **Package Manager**: npm/yarn.

### Pre-requisite Packages
* **UI**: `@angular/material`, `primeng`, `primeicons`.
* **Styling**: `bootstrap`, `scss`.
* **Utilities**: `date-fns`, `rxjs`.
* **Backend**: `firebase`, `@angular/fire`, `tcb-js-sdk`.

### Installation
1.  **Clone**: `git clone https://github.com/Soucieux/Angular-Accomplishment.git`
2.  **Install**: `npm install`
3.  **Config**: Update `src/environments/environment.ts` with API credentials.
4.  **Run**: `ng serve`

---

## 🗺 Project Map
```text
src/app/
├── core/           # Auth services & Guards
├── features/       
│   ├── entertainment/ # Movie collection
│   ├── reminder/      # Expense & Task tables
│   └── patch-notes/   # Dev-log system
├── shared/         # Common UI & Pipes
└── home/           # Visual landing page
