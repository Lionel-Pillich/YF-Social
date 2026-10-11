import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `vite build --mode pages` erzeugt die statische Demo für GitHub Pages:
// API im Browser (VITE_LOCAL_API, siehe .env.pages), fiktive Demo-Daten.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: 'noindex-demo',
      transformIndexHtml: (html) =>
        mode === 'pages' ? html.replace('<head>', '<head>\n    <meta name="robots" content="noindex" />') : html,
    },
  ],
  base: mode === 'pages' ? '/YF-Social/' : '/',
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/media': 'http://localhost:3001',
    },
  },
}));
