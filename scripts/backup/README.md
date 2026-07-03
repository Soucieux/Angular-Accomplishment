# CloudBase → Firebase backup

A data safety net. **CloudBase is the primary** database that serves the app.
This tooling mirrors CloudBase into **Firebase** on a schedule so the data can be
**restored** if CloudBase's data is ever lost or corrupted.

Firebase here is a passive vault: the Angular app never reads the backup, and
users never log into it. There is no failover, no identity map, no auth mirroring
— records are copied out with their `_openid` and restored with the same
`_openid`.

## Separation from the live Firebase (important)

The app still serves overseas users live from Firebase (the region split stays),
so the backup must **never** overwrite that live data. It is isolated by path:
all backup data is written under a single `backup/` root node (see `BACKUP_ROOT`
in `config.js`), never at the top level where the live collections sit.

You can therefore use **the same Firebase project** the app already uses — just
point the backup's `FIREBASE_*` env at it, and the data lands under `/backup`
alongside (never on top of) the live nodes. A separate project is optional; use
one only if you want the backup isolated from the live project's own failure
domain (accidental deletion, compromise).

Two things to get right when sharing one project:

1. **Lock `/backup` down from clients.** The backup holds *every* CloudBase
   user's data. The Admin SDK writes bypass security rules, but your app users
   authenticate to the same project — so the RTDB rules must deny client access
   to `/backup`:

   ```json
   "rules": { "backup": { ".read": false, ".write": false } }
   ```

2. The live nodes and `/backup` never collide because they live at different
   paths — this is enforced in code, not just by convention.

## Layout

| File | Role |
| --- | --- |
| `config.js` | Collection list + page size |
| `transform.js` | `toFirebaseShape` / `fromFirebaseShape` (pure) |
| `cloudbase.js` | `fetchAllRecords` (paginated read) |
| `backup.js` | `backupCollection` / `runBackup` (logic) |
| `index.js` | Backup entrypoint (CloudBase → Firebase) |
| `restore-core.js` | `restoreCollection` / `runRestore` (logic) |
| `restore.js` | Restore entrypoint (Firebase → CloudBase) |
| `../../.github/workflows/backup.yml` | Daily schedule + manual trigger |

## Required secrets

Set these as **GitHub Actions repository secrets** (for the scheduled backup) and
as **environment variables** locally (for a manual restore). Never commit them.

| Name | Purpose |
| --- | --- |
| `CLOUDBASE_SECRET_ID` | CloudBase admin key id |
| `CLOUDBASE_SECRET_KEY` | CloudBase admin key secret |
| `CLOUDBASE_ENV_ID` | CloudBase environment id (e.g. `vision-canvas-...`) |
| `FIREBASE_SERVICE_ACCOUNT` | Service-account JSON of the backup Firebase project (may be the app's own project) |
| `FIREBASE_DATABASE_URL` | Realtime Database URL of that project (data lands under `/backup`) |

## Backup (automatic)

The workflow runs daily at 03:00 UTC. **Before trusting the schedule**, run it
once manually to verify end-to-end:

1. Add the five secrets above in GitHub → Settings → Secrets → Actions.
2. GitHub → Actions → "CloudBase to Firebase backup" → **Run workflow**
   (`workflow_dispatch`).
3. Confirm the run logs a per-collection summary and exits green.

Locally: `CLOUDBASE_SECRET_ID=... [etc] npm run backup`.

## Restore (manual, during recovery)

Restore **writes into CloudBase** and is guarded:

```bash
# Preview only — reads Firebase, writes nothing:
npm run restore -- --dry-run

# Real restore of every collection (must match CLOUDBASE_ENV_ID):
npm run restore -- --confirm <envId>

# Restore a single collection:
npm run restore -- --confirm <envId> --only reminder
```

A real restore refuses unless `--confirm <envId>` exactly matches
`CLOUDBASE_ENV_ID`.

## Restore drill (do this periodically)

A backup you have never restored is not a backup. Prove recoverability against a
**scratch** CloudBase environment — never production:

1. Run a backup (`npm run backup`) so Firebase holds a fresh mirror.
2. Point `CLOUDBASE_ENV_ID` (and the secret id/key) at a **scratch** CloudBase env.
3. Preview: `npm run restore -- --dry-run` — note the per-collection counts.
4. Restore: `npm run restore -- --confirm <scratchEnvId>`.
5. Compare the restored per-collection counts in the scratch env against the
   dry-run counts. They should match.

## Tests

```bash
npm test   # node --test — pure logic + orchestration (no network, no creds)
```

## Notes

- `COLLECTIONS` in `config.js` duplicates the `DATABASE_*` names from
  `src/app/common/constants.ts` (standalone Node tooling can't import the Angular
  TS constants). Keep them in sync when a collection is added or renamed.
- Each document's `_id` is stored as the **Firebase key**, not duplicated as a
  field in the body. Restore reattaches the key as `_id` before writing back to
  CloudBase, so the round-trip is lossless.
- The Firebase-only `preferences` node is intentionally excluded — it has no
  CloudBase counterpart.
- The backup runs from a GitHub runner (outside China) because it must reach
  **both** the `ap-shanghai` CloudBase endpoint and Firebase/Google; a CloudBase
  Cloud Function in `ap-shanghai` cannot reach Google.
