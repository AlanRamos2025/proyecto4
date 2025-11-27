import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from 'tailwindcss'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    hmr: {
      port: 5174
    },
    middlewareMode: false
  },
  // Mostrar solo errores en la consola de Vite
  logLevel: 'error'
})
