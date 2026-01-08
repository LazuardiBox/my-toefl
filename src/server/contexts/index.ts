// server/contexts/index.ts

import type { Drizzle } from "@/server/libraries/drizzle";

export type AppContext = {
  db: Drizzle;
  req: Request;
  requestId: string;
  status: string;
  auth: "true" | "false";
};
