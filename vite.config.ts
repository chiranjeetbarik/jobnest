import { defineConfig, type ViteDevServer, type Connect } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import type { ServerResponse } from 'http';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [
    react(),
    {
      name: 'vercel-api-middleware',
      configureServer(server: ViteDevServer) {
        const apiDir = path.resolve(__dirname, 'api');
        const apiFiles = readdirSync(apiDir).filter(file => file.endsWith('.ts'));

        server.middlewares.use(async (req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          if (req.url && req.url.startsWith('/api/')) {
            const endpoint = req.url.split('/')[2].split('?')[0];
            const file = apiFiles.find(f => f.replace('.ts', '') === endpoint);

            if (file) {
              try {
                const modulePath = path.join(apiDir, file);
                const moduleUrl = pathToFileURL(modulePath).href;
                // Bust cache for HMR
                const module = await import(`${moduleUrl}?t=${Date.now()}`);
                await module.default(req, res);
              } catch (e) {
                console.error(e);
                res.statusCode = 500;
                res.end('Internal Server Error');
              }
            } else {
              res.statusCode = 404;
              res.end('Not Found');
            }
          } else {
            next();
          }
        });
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
