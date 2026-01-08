// server/contexts/index.ts

import type { Drizzle } from "@/server/libraries/drizzle";

export type AppContext = {
  db: Drizzle;
  requestId: string;
  requestedAt: string;
  status: string;
  error?: string;
};
