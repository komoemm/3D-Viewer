import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'three/examples/jsm/utils/BufferGeometryUtils': path.resolve(
          __dirname,
          'node_modules/three/examples/jsm/utils/BufferGeometryUtils.js'
        ),
      },
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'credentialless',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'credentialless',
      },
    },
    build: {
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Isolate Three.js loaders (GLTFLoader, OBJLoader, STLLoader, FBXLoader, etc.)
            if (
              id.includes('three/examples/jsm/loaders') ||
              id.includes('three-stdlib')
            ) {
              return 'three-loaders';
            }
            // Isolate Three.js core
            if (id.includes('node_modules/three')) {
              return 'three-core';
            }
            // Isolate web-ifc and web-ifc-three BIM parsers into dedicated chunk
            if (id.includes('node_modules/web-ifc') || id.includes('node_modules/web-ifc-three')) {
              return 'web-ifc';
            }
            // Isolate React core runtime
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            // Isolate UI icon and animation libraries
            if (id.includes('node_modules/lucide-react') || id.includes('node_modules/motion')) {
              return 'vendor-ui';
            }
          },
        },
      },
    },
    esbuild: {
      // Remove console logs and debugger in production build for maximum PageSpeed & cleanliness
      drop: isProd ? ['console', 'debugger'] : [],
    },
  };
});
