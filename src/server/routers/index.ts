// server/routers/index.ts

import { orpc } from "@/server/core";
import { HelloPrivateRPC } from "@/server/services/private/HelloRPC";
import { HelloPublicRPC } from "@/server/services/public/HelloRPC";

/* ----------------- router procedure ----------------------- */

export const oRPCRouter = orpc.router({
  "hello-private": HelloPrivateRPC,
  "hello-public": HelloPublicRPC,
});
