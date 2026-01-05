import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const client = postgres(process.env.DATABASE_URL!, {
    ssl: "require",
});

export const database = drizzle(client);