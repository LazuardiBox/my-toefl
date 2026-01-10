// @/src/server/protected/HelloRPC.ts

/* ----------------- import module ----------------------- */

import { randomBytes } from "node:crypto";
import { onStart } from "@orpc/server";
import { z } from "zod";
import * as core from "@/server/core";

/* ----------------- import function ----------------------- */

import { HelloFunction } from "@/server/functions/Hello";

/* ----------------- expose router ----------------------- */

const HelloRoute = {
  method: "GET",
  path: "/hello-private",
} as const;

/* ----------------- schema ----------------------- */

const HelloInput = z.object({}).optional();
const HelloOutput = z.object({
  data: z.object({
    result: z.string(),
    requestId: z.string(),
  }),
});

/* ----------------- lifecycle ----------------------- */

function HelloStart({ context }: { context: core.AppContext }) {
  context.requestId = `${randomBytes(4).toString("hex")}-${Date.now()}`;
}

/* ----------------- function ----------------------- */

async function HelloHandler({ context }: { context: core.AppContext }) {
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

/* ----------------- router ----------------------- */

export const HelloPrivateRPC = core.orpc
  .use(core.authMiddleware)
  .use(core.dbMiddleware)
  .use(onStart(HelloStart))
  .route(HelloRoute)
  .input(HelloInput)
  .output(HelloOutput)
  .handler(HelloHandler);
