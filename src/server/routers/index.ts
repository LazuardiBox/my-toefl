// server/routers/index.ts

import { orpc } from "@/server/core";
import { hello } from "@/server/services/hello.service";

/* ----------------- router procedure ----------------------- */

export const appRouter = orpc.router({
  hello,
});
