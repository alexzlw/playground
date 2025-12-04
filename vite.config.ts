import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure we can import from the root directory
  resolve: {
    alias: {
      src: "/",
    },
  },
})