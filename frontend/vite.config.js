import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server forwards /api requests to the backend, so the browser
// sees one address and the login session cookie works.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': env.BACKEND_URL || 'http://localhost:5001'
      }
    }
  }
})
