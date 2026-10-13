import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  let appBuildTime = Date.now();
  let appBuildId = `bld_${appBuildTime}`;
  try {
    const versionPath = path.resolve(__dirname, 'public', 'version.json');
    if (fs.existsSync(versionPath)) {
      const vData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
      if (typeof vData.buildTime === 'number') appBuildTime = vData.buildTime;
      if (typeof vData.buildId === 'string') appBuildId = vData.buildId;
    }
  } catch {
    // fallback
  }

  return {
    base: './',
    define: {
      __APP_BUILD_TIME__: appBuildTime,
      __APP_BUILD_ID__: JSON.stringify(appBuildId),
      __APP_VERSION__: JSON.stringify('1.0.0'),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['icon.svg', 'avatar.svg', 'avatar.png', 'version.json'],
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: false,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,svg,png,ico,webmanifest,json}'],
          runtimeCaching: [
            {
              urlPattern: /version\.json/,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages-cache',
                networkTimeoutSeconds: 3,
              },
            },
          ],
        },
        manifest: {
          id: './',
          name: 'EIE-Workflow',
          short_name: 'EIE-Workflow',
          description: 'Visual no-code/low-code workflow automation platform. Connect applications, APIs, databases, AI services, communication platforms, and webhooks.',
          theme_color: '#090d16',
          background_color: '#090d16',
          display: 'standalone',
          start_url: './',
          scope: './',
          icons: [
            {
              src: 'icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
