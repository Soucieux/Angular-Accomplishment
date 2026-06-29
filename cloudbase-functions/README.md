# CloudBase Cloud Functions — Shared Reminder Groups

These three functions implement the server-side half of the Shared Reminder Groups
feature (see `docs/plans/2026-06-29-shared-reminder-groups-design.md`).

They are **NOT part of the Angular build**. They live here as deploy-ready source for
you to push to your CloudBase environment. The Angular app calls them via
`cloudbase.callFunction({ name, data })`.

| Function | Purpose | Triggered by |
|----------|---------|--------------|
| `joinGroup` | Adds the caller to another user's share group; re-syncs `sharedWith` on both sides' shared reminders | Account page "Join" (deferred UI) |
| `leaveGroup` | Removes the caller from every shared reminder's `sharedWith` | Account page "Leave" (deferred UI) |
| `broadcastActivity` | Fans out one activity entry to every group member's `recentActivities` | Reminder mutation on a shared item |

## Deploying

Each function is a folder with `index.js` + `package.json`. Deploy each one through the
CloudBase console (云函数 → 新建/上传) or the CloudBase CLI, using the **same environment**
as the app (`vision-canvas-2gs531jy76d7aaa9`). Runtime: Node.js 16+.

## ⚠️ Verify before relying on these (read this first)

1. **Caller openid resolution.** Each function derives the caller's identity with:
   ```js
   const { openId: callerOpenid } = app.auth().getUserInfo();
   ```
   This is the `openId` from the auth context — matching the `_openid` field on documents
   and the `auth.openid` your security rules see. (`uid` is intentionally not used.)

2. **`@cloudbase/node-sdk` is correct HERE.** The project rule "never use `@cloudbase/node-sdk`"
   applies to *local seeding scripts you run on your machine* (which would need a secretId).
   Inside a deployed function, `tcb.init({ env: tcb.SYMBOL_CURRENT_ENV })` uses the function's
   built-in admin credentials — no secret needed. This is the documented pattern.

3. **No `pull` / `addToSet`.** CloudBase `db.command` only has `push / pop / shift / unshift`.
   Removing a specific array element and de-duplicated appends are done as read-modify-write
   with `_.set(newArray)` — that is why these functions read, compute in JS, then write.

4. **Activity cap = 20.** `recentActivities` is prepended (newest first) and trimmed to 20,
   matching `STATS_CAP_ACTIVITY_LOG` in `src/app/common/constants.ts`. Keep these in sync.

5. **Security.** The caller openid is always taken from the auth context, never from the
   request body, so a client cannot impersonate another user. `broadcastActivity` additionally
   verifies the caller is a member of the reminder's `sharedWith` before fanning out.

## Field/collection names (must match the app)

- reminder collection: `reminder`
- statistics collection: `statistics`
- reminder fields: `_openid`, `isShared`, `sharedWith`
- statistics fields: `_openid`, `isUserStats`, `recentActivities`
