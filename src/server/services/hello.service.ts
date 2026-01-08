/* ----------------- import procedure ----------------------- */

import { randomBytes } from "node:crypto";
import { onStart } from "@orpc/server";
import { z } from "zod";
import { orpc } from "@/server/core";
import { pingDatabase } from "@/server/functions/hello.function";
import { databaseMiddleware } from "@/server/middlewares/databaseMiddleware";
import type { AppContext } from "../contexts";

/* ----------------- expose procedure ----------------------- */

const hello_route = {
  method: "GET",
  path: "/hello",
} as const;

/* ----------------- schema procedure ----------------------- */

const hello_output = z.object({
  result: z.string(),
  status: z
    .literal("HTTP/1.1 200 OK")
    .or(z.literal("HTTP/1.1 500 Internal Server Error")),
  requestId: z.string(),
});

/* ----------------- lifecycle hooks ----------------------- */

function hello_cycle_start({ context }: { context: AppContext }) {
  context.requestId = `${randomBytes(4).toString("hex")}-${Date.now()}`;
}

/* ----------------- function hooks ----------------------- */

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
/* ----------------- router procedure ----------------------- */

export const hello = orpc
  .use(databaseMiddleware)
  .use(onStart(hello_cycle_start))
  .route(hello_route)
  .output(hello_output)
  .handler(hello_function);
