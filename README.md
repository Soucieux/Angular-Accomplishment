# 🌌 VISION CANVAS: Angular-Accomplishment

[cite_start]A self-designed, private management suite built with **Angular** to bridge the gap between daily entertainment tracking, personal task management, and professional history archiving[cite: 528].

> [cite_start]**Note:** This is a private space designed for personal data sovereignty and centralized life organization[cite: 528].

---

## 🧭 Table of Contents
* [Core Features](#-core-features)
* [System Architecture](#-system-architecture)
* [Project Map](#-project-map)
* [Getting Started](#-getting-started)

---

## ✨ Core Features

| Feature | Functionality | Status |
| :--- | :--- | :--- |
| **Entertainment Hub** | [cite_start]Track movies/dramas with automated **Douban lookup**, category filtering, and history restoration[cite: 541]. | [cite_start]**Stable** [cite: 541] |
| **Reminder Suite** | [cite_start]Triple-table system for date calculations, account expense/debt tracking, and personal task management[cite: 542]. | [cite_start]**Refining** [cite: 542] |
| **Vision Home** | [cite_start]Animated landing page featuring bilingual lines, movie quotes, and refreshed visual effects. | [cite_start]**Updated**  |
| **Patch Notes** | [cite_start]Internal development log tracking bugs (e.g., pagination fixes) and feature status[cite: 543]. | [cite_start]**Active** [cite: 543] |
| **Secure Entry** | [cite_start]Protected access via form validation, verification codes, and **Google Sign-In**[cite: 544]. | [cite_start]**Stable** [cite: 544] |

---

## 🏗 System Architecture
[cite_start]The application utilizes a **Hybrid Backend Architecture** to balance performance and storage[cite: 548]:

* [cite_start]**Firebase**: Primary engine for authentication, real-time data storage, and hosting[cite: 548].
* [cite_start]**Cloudbase**: Integrated specifically for optimized image retrieval and supplemental database management[cite: 548].
* [cite_start]**RxJS**: Powers reactive data flows between the hybrid backend and the Angular frontend[cite: 549].

---

## 🗺 Project Map
A simplified look at the `src/app` structure to understand the module logic:

```text
src/app/
├── core/           # Auth services & Route guards
├── features/       
│   ├── entertainment/ # Movie collection & Douban API
│   ├── reminder/      # Expense & Task tables
│   └── patch-notes/   # Dev log system
├── shared/         # Common UI components & Dialogs
└── home/           # Visual landing page
