# CloudBase Cloud Functions — Connected Accounts and Shared Reminders

These functions implement cross-account linking and shared-reminder operations that the
Angular client cannot perform directly under the database security rules (see
`docs/plans/2026-06-30-connected-accounts-design.md`).

The current design uses **pairwise connections**, not groups. Each connected account's openid
appears in the other account's `users.sharedWith` list. Shared reminders remain owned by their
creator and are visible to every account directly connected to that owner. There are no group
documents, group merges, or `groupId` fields in this flow.

These functions are **NOT part of the Angular build**. They live here as deploy-ready source for
you to push to your CloudBase environment. The Angular app calls them via
`cloudbase.callFunction({ name, data })`.

This document covers the connected-account and shared-reminder functions. The passphrase-lock
functions in this directory support a separate feature.

| Function | Purpose | Triggered by |
|----------|---------|--------------|
| `sendConnectRequest` | Looks up a target by connect code and creates matching incoming/outgoing pending-request records | Account → Connections → Send request |
| `cancelConnectRequest` | Removes a pending request from both accounts | Account → Connections → Cancel request |
| `respondConnectRequest` | Approves or declines a pending request; approval creates a bidirectional `sharedWith` connection | Account → Connections → Approve / Decline |
| `disconnect` | Removes one pairwise connection from both accounts and marks it as left | Account → Connections → Disconnect |
| `getSharedReminders` | Returns shared reminders owned by the caller's connected accounts | Reminder page load or refresh signal |
| `editSharedReminder` | Authorizes and performs cross-account edit, delete, or complete operations | Reminder → Edit / Delete / Complete |
| `getSharedActivity` | Merges the caller's and connected accounts' shared-reminder activity, newest first | Home activity feed |
| `notifySharedChange` | Bumps `sharedRev` on the caller and connected accounts so their live watches re-fetch shared reminders | After a shared reminder is created, edited, deleted, or completed |

> The previous v1 trio (`joinGroup`, `leaveGroup`, `broadcastActivity`) and the later
> `statistics`-group model were abandoned. The current implementation stores only direct
> account-to-account edges in `users.sharedWith`.

## How shared-reminder refresh works

CloudBase's realtime reminder watcher cannot reliably push another account's documents to the
current user. Each account can, however, reliably watch its own `users` document.

1. A shared reminder is created or changed.
2. The client calls `notifySharedChange` without reminder data.
3. The function sets `sharedRev` to the current timestamp on the caller's user document and every
   directly connected account's user document.
4. Each affected client's own user-document watcher observes the new revision and calls
   `getSharedReminders`.

`notifySharedChange` does not edit the reminder itself. It is a fire-and-forget invalidation
signal; if it fails, the reminder write can still succeed, but connected clients may not see the
change until another refresh signal or a page reload.

The recipient list comes from the **caller's** `sharedWith` list. If account A edits a reminder
owned by account B, an account connected to B but not to A is not signalled by this call and may
remain stale until its next refresh. Supporting that case would require the function to receive and
validate the reminder owner, then notify the owner's connections as well.

## Deploying

Each function is a folder with `index.js` + `package.json`. Before deployment, run
`node sync-shared.js` from this directory so every isolated function bundle receives the current
shared `lib.js`. Deploy each function through the CloudBase console (云函数 → 新建/上传) or the
CloudBase CLI, using the **same environment** as the app (`vision-canvas-2gs531jy76d7aaa9`).
Runtime: Node.js 16+.

## ⚠️ Verify before relying on these (read this first)

1. **Caller identity resolution.** Each function derives the caller with:
   ```js
   const { openId, uid } = app.auth().getUserInfo();
   const callerOpenid = openId || uid;
   ```
   **`openId` is empty under web/email auth** (it is only populated for WeChat), so the `uid`
   fallback is required — omitting it returns `NO_AUTH`. In this app `_openid == auth.uid == uid`,
   so `callerOpenid` matches the `_openid` field on documents and the `auth.uid` your rules compare.
   The display **name** is taken from the request body (cosmetic only); identity never is.

2. **`@cloudbase/node-sdk` is correct HERE.** The project rule "never use `@cloudbase/node-sdk`"
   applies to *local seeding scripts you run on your machine* (which would need a secretId).
   Inside a deployed function, `tcb.init({ env: tcb.SYMBOL_CURRENT_ENV })` uses the function's
   built-in admin credentials — no secret needed. This is the documented pattern.

3. **No `pull` / `addToSet`.** CloudBase `db.command` only has `push / pop / shift / unshift`.
   Removing requests or connection edges and deduplicating arrays are done as read-modify-write
   with `_.set(newArray)`. New requests are appended with `_.push([entry])`.

4. **`users._id == _openid`.** The migration guarantees each `users` doc is keyed by its owner's
   openid, so `db.collection('users').doc(openid)` targets that user. The same holds for `doc(user._id)`.

5. **Cross-account edits are allow-listed.** `editSharedReminder` permits only reminder content
   fields (`text`, `date`, `link`, `tag`, `startTime`, `endTime`). A connected account cannot change
   ownership metadata or the `isShared` flag.

6. **Activity cap = 20.** `getSharedActivity` merges each connected account's
   `sharedRecentActivity`, sorts entries newest-first by `timestamp`, and returns at most 20.

## Linking policy (`respondConnectRequest`)

- **Decline** removes the incoming request and marks the sender's outgoing request as declined.
- **Approve** adds each account's openid to the other's `sharedWith` list and upserts a connected
  record in each account's `connections` list.
- **Disconnect** removes only that pairwise edge. Other connections are unaffected.
- **Reconnect** replaces the prior left-state record with a connected record.

## Field/collection names (must match the app)

- Collections: `users`, `reminder`
- `users` identity fields: `_id`, `_openid`, `connectCode`
- `users` connection fields: `sharedWith` (openid[]), `connections`
  (`{ openid, name, status }[]`), `incomingRequests`, `outgoingRequests`
- `users` shared-reminder signal/feed fields: `sharedRev`, `sharedRecentActivity`,
  `completedShared`
- `reminder` ownership/sharing fields: `_id`, `_openid`, `isShared`
