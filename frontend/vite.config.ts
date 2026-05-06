import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // SSE: disable any buffering on the proxy so chunks pass through immediately
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['cache-control'] = 'no-cache, no-transform'
            // ensure no compression that would buffer
            delete proxyRes.headers['content-encoding']
          })
        },
      },
      // Scenic-spot mock backend serves images at :5001/images/*.jpg.
      // UI Schema CardList uses these relative URLs as <img src>; proxy
      // them so the browser doesn't 404 against the Vite dev server.
      '/images': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})
