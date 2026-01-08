// server/libraries/drizzle.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {
  ssl: "require",
  connect_timeout: 1,
  idle_timeout: 5,
  max_lifetime: 60,
});

export const db = drizzle(client);

export type Drizzle =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];
