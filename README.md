# VISION CANVAS

A personal Angular web application for organizing everyday life, entertainment records, reminders, project notes, and personal history in one private space.

## Timeline

### Release 1.0

| Date / Range | Page / Area | Work Completed |
| ------ | ------ | ------ |
| 2024.02.05 | Project | Initialized the Angular project and created the first version of the app. |
| 2024.09.23 | Login | Started the first user login work. |
| 2025.02.21 - 2026.02.01 | Entertainment | Built the main entertainment collection page for tracking movies and dramas. Added category filtering, movie cards, rating display, cover image display, favourite records, search, edit, add, delete, history restore, Douban lookup, and rating refresh work. |
| 2025.11.02 - 2026.01.25 | Patch Notes | Built the patch notes page to record app changes. Added grouped records, status labels, filtering, pagination, edit mode, delete flow, and new record creation. |
| 2025.11.28 - 2025.12.07 | Login | Improved the login experience with form validation, verification-code flow, and Google sign-in support. |
| 2026.01.03 - 2026.01.22 | Reminder | Built the first table for date calculation and charged-state tracking. Added next-month support, reset flow, and editable values. |
| 2026.01.08 - 2026.01.22 | Reminder | Built the second table for account expense records. Added paid status, debt values, date selection, default debt handling, and save indicators. |
| 2026.01.18 - 2026.01.22 | Reminder | Built the third table for personal messages/tasks. Added text records, due dates, links, popover editing, entry creation/removal, and pagination. |
| 2026.01.27 | About | Added the About page with a personal education and work timeline. |
| 2026.03.07 - Present | Database | Added Cloudbase support and continued database-related improvements. |
| 2026.05.02 | Home | Refreshed the Home page visuals with full-page blur styling, animated visual effects, title treatment, and quote styling. |
| 2026.05.02 | Dialogs | Polished dialog styling, especially the confirm, error, and add dialog button/footer consistency. |

## Components

### Home

- Landing page for the app.
- Presents the name, bilingual lines, and a closing movie quote.
- Focuses on visual mood and first impression.

### Entertainment

- **Purpose**: Keeps track of movies and dramas,
- Private collection page for movies and dramas.
- Helps track what is saved, watched, updated, or highlighted.
- Connects the personal collection with external movie information.

### Login

- **Purpose**:  Protects private data
- Entry point for private access.
- Supports sign-in and identity verification.
- Keeps private pages and data behind authentication.

### Patch Notes

- **Purpose**: Tracks the app's own development, 
- Development log for the project itself.
- Records changes by component, element, status, and date.
- Works as a lightweight roadmap and bug/task tracker.

### Reminder

- **Purpose**: Helps manage recurring personal records, 
- Personal reminder and record-management page.
- Keeps daily/monthly information in one place.
- Covers date calculation, account records, and personal message/task notes.

### About

- **Purpose**: Tells the story behind the person building it.
- Personal timeline page.
- Summarizes education and work history.
- Gives context for the person behind the project.

## Required Packages

- Angular
- Angular Material
- PrimeNG
- PrimeIcons
- Firebase
- Cloudbase
- RxJS
- Bootstrap
- date-fns

Install project dependencies with:

```bash
npm install
```

## Development

Start the local development server:

```bash
npm start
```

Open the app at:

```text
http://localhost:4200/
```

Build the project:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Run a TypeScript check:

```bash
npx tsc --noEmit -p tsconfig.app.json
```
