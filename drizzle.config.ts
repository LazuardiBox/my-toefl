import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "src/server/libraries/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: true,
  },
});
