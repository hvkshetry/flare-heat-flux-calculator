import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/flare-heat-flux-calculator/' // This should match your repository name exactly
})
