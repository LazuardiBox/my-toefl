# Protected oRPC Usage

This document demonstrates how to create a protected oRPC endpoint using the `hello-protected` example.

## Overview

The `hello-protected` procedure acts similarly to the public one but enforces strict authentication.
1.  It uses `authMiddleware` to verify the session.
2.  If the user is not authenticated, it returns a `401 Unauthorized` status.
3.  It connects to the database via `databaseMiddleware`.
4.  It executes the shared `pingDatabase` function.

## Function Logic

It reuses the same logic as the public service.

```typescript
// src/server/functions/hello.function.ts

import type { Drizzle } from "@/server/libraries/drizzle";

export async function pingDatabase(database: Drizzle, maxMs = 28) {
  const startedAt = performance.now();

  await database.execute("select 1");

  const endedAt = performance.now();
  const duration = endedAt - startedAt;

  if (duration > maxMs) {
    throw new Error();
  }

  return {
    response: `PONG in ${Math.round(duration)}ms`,
  };
}
```

## Service Definition

The service, located in `src/server/services/auth/hello.service.ts`, explicitly checks `context.auth`.

```typescript
/* ----------------- import module ----------------------- */

import { randomBytes } from "node:crypto";
import { onStart } from "@orpc/server";
import { z } from "zod";
import { orpc } from "@/server/core";
import type { AppContext } from "@/server/contexts";

/* ----------------- import function ----------------------- */

import { pingDatabase } from "@/server/functions/hello.function";
import { authMiddleware } from "@/server/middlewares/authMiddleware";
import { databaseMiddleware } from "@/server/middlewares/databaseMiddleware";

/* ----------------- expose router ----------------------- */

const hello_route = {
  method: "GET",
  path: "/hello-protected",
} as const;

/* ----------------- schema ----------------------- */

const hello_input = z.object({}).optional();
const hello_output = z.object({
  result: z.string(),
  status: z
    .literal("HTTP/1.1 200 OK")
    .or(z.literal("HTTP/1.1 401 Unauthorized"))
    .or(z.literal("HTTP/1.1 500 Internal Server Error")),
  requestId: z.string(),
});

/* ----------------- lifecycle ----------------------- */

function hello_cycle_start({ context }: { context: AppContext }) {
  context.requestId = `${randomBytes(4).toString("hex")}-${Date.now()}`;
}

/* ----------------- function ----------------------- */

async function hello_function({ context }: { context: AppContext }) {
  // Check Authentication Status
  if (context.auth !== "true") {
    return {
      status: "HTTP/1.1 401 Unauthorized" as const,
      requestId: context.requestId,
      result: "An unexpected error occurred while processing your request.",
    };
  }

  try {
    const result = await pingDatabase(context.db);

    return {
      status: "HTTP/1.1 200 OK" as const,
      requestId: context.requestId,
      result: result.response,
    };
  } catch (_error) {
    return {
      status: "HTTP/1.1 500 Internal Server Error" as const,
      requestId: context.requestId,
      result: "An unexpected error occurred while processing your request.",
    };
  }
}

/* ----------------- router ----------------------- */

export const hello_protected = orpc
  .use(authMiddleware)
  .use(databaseMiddleware)
  .use(onStart(hello_cycle_start))
  .route(hello_route)
  .input(hello_input)
  .output(hello_output)
  .handler(hello_function);
```
