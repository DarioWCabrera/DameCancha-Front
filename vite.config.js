import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  if (command === 'build') {
    const apiUrl = String(env.VITE_API_URL || '').trim();
    if (!apiUrl) {
      throw new Error(
        'Falta VITE_API_URL. Configurala con la URL pública HTTPS del backend antes de generar el build.',
      );
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(apiUrl);
    } catch {
      throw new Error('VITE_API_URL debe ser una URL válida.');
    }

    const isLocalBackend = ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname);

    if (mode === 'production' && !isLocalBackend && parsedUrl.protocol !== 'https:') {
      throw new Error(
        'VITE_API_URL debe utilizar HTTPS para un backend remoto. Para pruebas locales se permite http://localhost.',
      );
    }
  }

  return {
    plugins: [react()],
    build: {
      sourcemap: false,
    },
  };
});
