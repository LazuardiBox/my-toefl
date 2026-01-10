// @/src/server/functions/Hello.ts

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
