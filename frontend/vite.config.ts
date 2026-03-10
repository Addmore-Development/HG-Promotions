import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared':     path.resolve(__dirname, './src/shared'),
      '@promoter':   path.resolve(__dirname, './src/promoter'),
      '@business':   path.resolve(__dirname, './src/business'),
      '@admin':      path.resolve(__dirname, './src/admin'),
    },
  },
})