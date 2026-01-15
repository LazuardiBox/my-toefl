// @/src/server/plugins/hono.ts

// @ts-nocheck
/* eslint-disable */

import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { CORSPlugin } from "@orpc/server/plugins";
import { Hono } from "hono";
import type { AppContext } from "@/server/core";
import { db } from "@/server/libraries/drizzle";
import { appRouter } from "@/server/routers";

const app = new Hono();

const handler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      if (error instanceof ORPCError && error.status <= 500) {
        return;
      }
      console.error(error);
    }),
  ],
  plugins: [
    new CORSPlugin({
      origin: (origin) => origin,
      allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    }),
  ],
});

app.use("/orpc/*", async (c, next) => {
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: "/orpc",
    context: {
      req: c.req.raw,
      drizzle: db,
      requestId: crypto.randomUUID(),
      auth: "false",
    } satisfies AppContext,
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});

export default app;
