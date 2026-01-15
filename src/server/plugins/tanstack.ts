import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

import { oRPCRouter } from "@/server/routers";

export const rpcHandler = new RPCHandler(oRPCRouter, {
  interceptors: [
    onError((error) => {
      if (error instanceof ORPCError && error.status <= 500) {
        return;
      }

      console.error(error);
    }),
  ],
});
