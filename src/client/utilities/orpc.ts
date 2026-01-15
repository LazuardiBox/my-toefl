import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { oRPCRouter } from "@/server/routers";

const baseURL = import.meta.env.VITE_ORPC_BASE_URL;

export const orpc: RouterClient<typeof oRPCRouter> = createORPCClient(
  new RPCLink({
    url: `${baseURL}/orpc`,
  }),
);
