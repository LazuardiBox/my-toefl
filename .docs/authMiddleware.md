# Auth Middleware Documentation

This document explains the logic and flow of the `authMiddleware` used in the application.

## Overview

The `authMiddleware` is defined in `src/server/core/index.ts` and is responsible for determining the authentication status of a request. It sets the `auth` property in the `AppContext` to either `"true"` or `"false"`.

The middleware is designed for **high performance** and **low latency** by eliminating external HTTP requests and leveraging database indexes.

## Logical Flow

The middleware follows strict steps to validate a session:

1.  **Cookie Check**
    *   Inspects the request headers for the `cookie` header.
    *   If missing -> `auth = "false"`.

2.  **Local Token Extraction**
    *   Parses the cookie string locally using Regex.
    *   Target Cookie Name: `__Secure-better-auth.session_token`
    *   Regex: `/(?:__Secure-)?better-auth\.session_token=([^;]+)/`
    *   If token is not found -> `auth = "false"`.

3.  **Database Validation (Optimized)**
    *   Performs a direct query to the local PostgreSQL database (`session` table) via `context.db`.
    *   **Conditions**:
        1.  `token`: Matches the extracted token exactly.
        2.  `expiresAt`: Must be greater than the current time (`new Date()`).
    *   **Optimization**:
        *   The query uses the **Unique Index** on the `token` column.
        *   It selects **only the `id` column** to minimize data transfer overhead.

4.  **Result**
    *   If a matching, non-expired session is found -> `auth = "true"`.
    *   Otherwise -> `auth = "false"`.

## Performance Features

*   **Zero External Latency**: No `fetch()` calls to external auth services. Logic is self-contained.
*   **Index Scan**: Uses the database's B-Tree index for immediate row retrieval.
*   **Minimal Payload**: Fetches strictly what is needed (existence check).

## Code Example

```typescript
// src/server/core/index.ts

export const authMiddleware = orpc.middleware(async ({ context, next }) => {
  let auth: "true" | "false" = "false";

  try {
    const cookieHeader = context.req.headers.get("cookie");

    if (!cookieHeader) {
      return next({ context: { ...context, auth } });
    }

    // 1️⃣ Extract token locally
    const match = cookieHeader.match(
      /(?:__Secure-)?better-auth\.session_token=([^;]+)/,
    );
    const token = match
      ? decodeURIComponent(match[1]).split(".")[0]
      : undefined;

    if (!token) {
      return next({ context: { ...context, auth } });
    }

    // 2️⃣ Validate token in DB
    const session = await context.db.query.session.findFirst({
      where: (session, { eq, gt, and }) =>
        and(eq(session.token, token), gt(session.expiresAt, new Date())),
      columns: {
        id: true,
      },
    });

    if (session) {
      auth = "true";
    }
  } catch {
    auth = "false";
  }

  return next({
    context: {
      ...context,
      auth,
    },
  });
});
```
