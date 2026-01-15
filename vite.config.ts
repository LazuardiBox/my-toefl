import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath, URL } from 'url'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    devtools(),
    nitro(),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),

    tanstackStart({
      srcDirectory: '.',
      router: {
        entry: 'router/router',
        routesDirectory: 'src/client/routes',
        generatedRouteTree: 'router/routeTree.gen.ts',
      },
    }),
    viteReact(),
  ],
  server: {
    allowedHosts: true,
  },
})

export default config
