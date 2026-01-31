import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/dungeon-crawler/', // Проверь, чтобы это совпадало с именем репо!
})