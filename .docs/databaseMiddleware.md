# Database Middleware Documentation

This document explains the usage and behavior of the `dbMiddleware`.

## Overview

The `dbMiddleware` is defined in `src/server/core/index.ts` and provides **Flash Transaction** support for the application. It ensures that every procedure runs within an isolated database transaction.

## Logic Flow

1.  **Transaction Start**
    *   The middleware initiates a new Drizzle ORM transaction (`db.transaction`).

2.  **Context Injection**
    *   It replaces the global `db` instance in the `context` with the **transaction key** (`tx`).
    *   This means any database query run inside the procedure (e.g., `context.db.insert(...)`) is automatically part of this transaction.

3.  **Procedure Execution**
    *   Control is passed to the next middleware or the procedure handler (`next()`).

4.  **Automatic Commit / Rollback**
    *   **Success**: If the procedure completes without throwing an error, the transaction is automatically **committed** to the database.
    *   **Error**: If the procedure (or any downstream code) throws an exception, the transaction is automatically **rolled back**.

## Code Example

```typescript
// src/server/core/index.ts

export const dbMiddleware = orpc.middleware(async ({ context, next }) => {
  return db.transaction(async (tx) => {
    return next({
      context: {
        ...context,
        db: tx,
      },
    });
  });
});
```

## Benefits

*   **Atomicity**: Ensures all database operations within a request either succeed together or fail together.
*   **Data Integrity**: Prevents partial states.
*   **Isolation**: Queries within the transaction see a consistent snapshot of the database.
