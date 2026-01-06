import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configuração para SPA - todas as rotas redirecionam para index.html
  // Isso resolve o problema de refresh em rotas específicas
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})