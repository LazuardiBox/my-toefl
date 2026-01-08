// server/core/orpc.ts

import { os } from "@orpc/server";
import type { AppContext } from "@/server/contexts";

export const orpc = os.$context<AppContext>();
