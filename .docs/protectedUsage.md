# Protected oRPC Usage

This document demonstrates how to create a protected oRPC endpoint using the `hello-private` example.

## Overview

The `hello-private` procedure acts similarly to the public one but enforces strict authentication.
1.  It uses `authMiddleware` to populate the `auth` context.
2.  It checks `context.auth` in the handler and throws `core.Unauthorized(context)` if "false".
3.  It connects to the database via `dbMiddleware`.
4.  It executes the shared `HelloFunction`.

## Function Logic

It reuses the same logic as the public service (`src/server/functions/Hello.ts`).

## Service Definition

The service, located in `src/server/private/HelloRPC.ts`, explicitly checks `context.auth`.

```typescript
// src/server/private/HelloRPC.ts

import { randomBytes } from "node:crypto";
import { onStart } from "@orpc/server";
import { z } from "zod";
import * as core from "@/server/core";
import { HelloFunction } from "@/server/functions/Hello";

const HelloRoute = {
  method: "GET",
  path: "/hello-private",
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
  // Enforce Authentication
  if (context.auth !== "true") {
    throw core.Unauthorized(context);
  }

  try {
    const result = await HelloFunction(context);

    return core.Success(context, result.response);
  } catch (_error) {
    throw core.InternalServerError(context);
  }
}

export const HelloPrivateRPC = core.orpc
  .use(core.authMiddleware) // Populates context.auth
  .use(core.dbMiddleware)
  .use(onStart(HelloStart))
  .route(HelloRoute)
  .input(HelloInput)
  .output(HelloOutput)
  .handler(HelloHandler);
```
