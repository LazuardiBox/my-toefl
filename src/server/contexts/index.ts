// server/contexts/index.ts

import type { Drizzle } from "@/server/libraries/drizzle";

export type AppContext = {
  db: Drizzle;
  requestId: string;
  status: string;
};
