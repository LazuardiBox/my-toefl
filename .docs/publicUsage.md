# Public oRPC Usage

This document demonstrates how to create a public oRPC endpoint using the `hello-public` example.

## Overview

The `hello-public` procedure is a simple endpoint that:
1.  Is accessible to everyone (no authentication required).
2.  Connects to the database using `dbMiddleware`.
3.  Executes a `HelloFunction`.
4.  Returns a success response using `core.Success` or throws an error.

## Function Logic

This function, located in `src/server/functions/Hello.ts`, performs the actual database check.

```typescript
// src/server/functions/Hello.ts

import { performance } from "node:perf_hooks";
import * as core from "@/server/core";

const MAX_PING_MS = 100;

export async function HelloFunction(context: core.AppContext) {
  const startedAt = performance.now();

  await context.db.execute("select 1");

  const duration = performance.now() - startedAt;

  if (duration > MAX_PING_MS) {
    throw core.InternalServerError(context);
  }

  return {
    response: `PONG in ${Math.round(duration)}ms`,
  };
}
```

## Service Definition

The service, located in `src/server/public/HelloRPC.ts`, defines the route, schema, and handler.

```typescript
// src/server/public/HelloRPC.ts

import { randomBytes } from "node:crypto";
import { onStart } from "@orpc/server";
import { z } from "zod";
import * as core from "@/server/core";
import { HelloFunction } from "@/server/functions/Hello";

const HelloRoute = {
  method: "GET",
  path: "/hello-public",
} as const;

const HelloInput = z.object({}).optional();
const HelloOutput = z.object({
  data: z.object({
    result: z.string(),
    requestId: z.string(),
  }),
});

function HelloStart({ context }: { context: core.AppContext }) {
  context.requestId = `${randomBytes(4).toString("hex")}-${Date.now()}`;
}

async function HelloHandler({ context }: { context: core.AppContext }) {
  try {
    const result = await HelloFunction(context);

    return core.Success(context, result.response);
  } catch (_error) {
    throw core.InternalServerError(context);
  }
}

export const HelloPublicRPC = core.orpc
  .use(core.dbMiddleware)
  .use(onStart(HelloStart))
  .route(HelloRoute)
  .input(HelloInput)
  .output(HelloOutput)
  .handler(HelloHandler);
```
