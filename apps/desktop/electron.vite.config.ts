import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode);

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      define: {
        'process.env.MAIN_VITE_PUBLIC_POSTHOG_KEY': JSON.stringify(
          env.MAIN_VITE_PUBLIC_POSTHOG_KEY || ''
        ),
        'process.env.MAIN_VITE_PUBLIC_POSTHOG_HOST': JSON.stringify(
          env.MAIN_VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
        ),
      },
      build: {
        rollupOptions: {
          external: ['fluent-ffmpeg'],
        },
      },
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
    },
    renderer: {
      resolve: {
        alias: {
          '@': resolve('src/renderer'),
          '@workspace/shared': resolve('../../packages/shared/src'),
        },
      },
      plugins: [react(), tailwindcss()],
    },
  };
});
