import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// React Compiler включён через reactCompilerPreset из @vitejs/plugin-react v6+
// Демо-компоненты с "use no memo" явно отключают автомемоизацию для наглядности
export default defineConfig({
  plugins: [react()],
})
