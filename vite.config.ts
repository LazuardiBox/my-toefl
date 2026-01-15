import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { customRoutesManifestPlugin } from "./scripts/manifestGenerator";
import { filterTanStackUnusedImports } from "./scripts/rollupWarnings";

export default defineConfig({
  resolve: {
    alias: {
      "@/routers": fileURLToPath(new URL("./routers", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  esbuild: {
    logLevel: "silent",
    logOverride: {
      "module-level-directive": "silent",
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      logLevel: "silent",
      logOverride: {
        "module-level-directive": "silent",
      },
    },
  },
  plugins: [
    nitro(),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    customRoutesManifestPlugin(),
    tanstackStart({
      srcDirectory: ".",
      router: {
        enableRouteGeneration: false,
        entry: "routers/index.tsx",
      },
      client: { entry: "routers/entry-client.tsx" },
      server: { entry: "routers/entry-server.tsx" },
    }),
    viteReact(),
  ],
  build: {
    rollupOptions: {
      onwarn: filterTanStackUnusedImports(),
    },
  },
  server: {
    allowedHosts: true,
  },
});
