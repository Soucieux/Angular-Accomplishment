# CloudBase Cloud Functions — Connected Accounts

These three functions implement the server-side half of the Connected Accounts (account
linking) feature (see `docs/plans/2026-06-30-connected-accounts-design.md`).

They are **NOT part of the Angular build**. They live here as deploy-ready source for
you to push to your CloudBase environment. The Angular app calls them via
`cloudbase.callFunction({ name, data })`.

| Function | Purpose | Triggered by |
|----------|---------|--------------|
| `sendConnectRequest` | Looks up a target by connect code and appends a pending request to their `users.incomingRequests` | Account → Connections → "Send request" |
| `respondConnectRequest` | Approves (create / join / **merge** groups) or declines a pending request | Account → Connections → Approve / Decline |
| `disconnect` | Removes the caller from their group; dissolves the group when one member remains | Account → Connections → Disconnect |

> The previous v1 trio (`joinGroup`, `leaveGroup`, `broadcastActivity`) was for the abandoned
> denormalized `sharedWith`-per-reminder design and has been deleted.

## Deploying

Each function is a folder with `index.js` + `package.json`. Deploy each one through the
CloudBase console (云函数 → 新建/上传) or the CloudBase CLI, using the **same environment**
as the app (`vision-canvas-2gs531jy76d7aaa9`). Runtime: Node.js 16+.

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
   Removing a request, removing a member, and merging arrays are done as read-modify-write with
   `_.set(newArray)`. New requests are appended with `_.push([entry])`.

4. **`users._id == _openid`.** The migration guarantees each `users` doc is keyed by its owner's
   openid, so `db.collection('users').doc(openid)` targets that user. The same holds for `doc(user._id)`.

5. **Activity cap = 20.** On a group merge, the two `sharedRecentActivity` arrays are concatenated,
   sorted newest-first by `timestamp`, and trimmed to 20 — matching `STATS_CAP_ACTIVITY_LOG`.

## Linking policy (respondConnectRequest)

On approve, the two `groupId`s decide the outcome:

- **both null** → create a new group doc (`statistics`, `isGroup: true`) with both members.
- **exactly one set** → the other joins that group.
- **both set & different** → **merge**: union members, merge `memberProfiles`, concat+cap
  `sharedRecentActivity` into the **approver's** group (survivor), re-point every absorbed member's
  `users.groupId`, then delete the absorbed group doc.
- **both set & same** → no-op (already connected).

## Field/collection names (must match the app)

- collections: `users`, `statistics`, `reminder`
- `users` fields: `_openid`, `connectCode`, `groupId`, `incomingRequests` (`{ fromOpenid, fromName, ts }`)
- `statistics` group docs: `_id`, `isGroup`, `sharedWith` (openid[]), `memberProfiles` (`{ openid: { name } }`), `sharedRecentActivity`
- `reminder` fields: `_openid`, `isShared`
