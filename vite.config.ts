// vite.config.ts — build tool configuration
// Vite is the tool that compiles your TypeScript/React files into plain JS
// that the browser can understand. It also runs the local dev server.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // Tell Vite to understand React's JSX syntax (e.g. <div>, <Button />)
  plugins: [react()],

  resolve: {
    alias: {
      // "@" is a shortcut for the "src/" folder.
      // So instead of writing "../../api/auth.api" you can write "@/api/auth.api"
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    // Dev server will start at http://localhost:3000
    port: 3000,

    proxy: {
      // Any request the browser makes to /api/... is secretly forwarded
      // to the Spring Boot backend running at localhost:8082.
      // This is called a "proxy" — it lets the browser think everything
      // is on the same origin (port 3000), so there are no CORS errors.
      // Without this, the browser would block cross-origin API calls.
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
