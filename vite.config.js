import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const page = (path) => fileURLToPath(new URL(path, import.meta.url))

// Two static entry points, so GitHub Pages serves /radmin/ without SPA routing tricks.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: page('./index.html'),
        admin: page('./radmin/index.html'),
      },
    },
  },
})
