# Public oRPC Usage

This document demonstrates how to create a public oRPC endpoint using the `hello-public` example.

## Overview

The `hello-public` procedure is a simple endpoint that:
1.  Is accessible to everyone (no authentication required).
2.  Connects to the database using `databaseMiddleware`.
3.  Executes a `pingDatabase` function.
4.  Returns a success or error status based on the database ping result.

## Function Logic

This function, located in `src/server/functions/hello.function.ts`, performs the actual database check.

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

The service, located in `src/server/services/public/hello.service.ts`, defines the route, schema, and handler.

```typescript
/* ----------------- import module ----------------------- */

import { randomBytes } from "node:crypto";
import { onStart } from "@orpc/server";
import { z } from "zod";
import { orpc } from "@/server/core";
import type { AppContext } from "@/server/contexts";

/* ----------------- import function ----------------------- */

import { pingDatabase } from "@/server/functions/hello.function";
import { databaseMiddleware } from "@/server/middlewares/databaseMiddleware";

/* ----------------- expose router ----------------------- */

const hello_route = {
    method: "GET",
    path: "/hello-public",
} as const;

/* ----------------- schema ----------------------- */

const hello_input = z.object({}).optional();
const hello_output = z.object({
    result: z.string(),
    status: z
        .literal("HTTP/1.1 200 OK")
        .or(z.literal("HTTP/1.1 500 Internal Server Error")),
    requestId: z.string(),
});

/* ----------------- lifecycle ----------------------- */

function hello_cycle_start({ context }: { context: AppContext }) {
    context.requestId = `${randomBytes(4).toString("hex")}-${Date.now()}`;
}

/* ----------------- function ----------------------- */

async function hello_function({ context }: { context: AppContext }) {
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

export const hello_public = orpc
    .use(databaseMiddleware)
    .use(onStart(hello_cycle_start))
    .route(hello_route)
    .input(hello_input)
    .output(hello_output)
    .handler(hello_function);
```
