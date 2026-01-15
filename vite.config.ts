import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { customRoutesManifestPlugin } from './scripts/manifestGenerator'
import { filterTanStackUnusedImports } from './scripts/rollupWarnings'

export default defineConfig({
  resolve: {
    alias: {
      '@/routers': fileURLToPath(new URL('./routers', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    nitro(),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    customRoutesManifestPlugin(),
    tanstackStart({
      srcDirectory: '.',
      router: {
        enableRouteGeneration: false,
        entry: 'routers/index.tsx',
      },
      client: { entry: 'routers/entry-client.tsx' },
      server: { entry: 'routers/entry-server.tsx' },
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
})
