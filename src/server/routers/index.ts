// server/routers/index.ts

import { orpc } from "@/server/core";
import { hello_protected } from "@/server/services/auth/hello.service";
import { hello_public } from "@/server/services/public/hello.service";

/* ----------------- router procedure ----------------------- */

export const appRouter = orpc.router({
  "hello-public": hello_public,
  "hello-protected": hello_protected,
});
