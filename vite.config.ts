import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      electron({
        main: {
          entry: 'electron/main.ts',
        },
        preload: {
          input: path.join(__dirname, 'electron/preload.ts'),
        },
        renderer: {},
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        // Proxy DuckDuckGo HTML in dev to avoid CORS from the browser (legacy fallback)
        '/ddg-search': {
          target: 'https://html.duckduckgo.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ddg-search/, '/html'),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        },
        // Ollama Web Search API proxy for browser/dev fallback (keeps key server-side)
        '/ollama-web-search': {
          target: 'https://ollama.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/ollama-web-search/, '/api/web_search'),
          headers: {
            Authorization: env.OLLAMA_API_KEY ? `Bearer ${env.OLLAMA_API_KEY}` : '',
            'Accept': 'application/json',
          },
        },
      },
    },
  };
});
