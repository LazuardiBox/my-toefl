/* ----------------- import procedure ----------------------- */

import { orpc } from "@/server/core";
import { hello_router } from "@/server/services/hello.service";

/* ----------------- router procedure ----------------------- */

export const appRouter = orpc.router({
  test: hello_router,
});
