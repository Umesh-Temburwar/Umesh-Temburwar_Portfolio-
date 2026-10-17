import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Local dev middleware to serve /api serverless functions directly in `npm run dev`
function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url ? req.url.split('?')[0] : '';

        // Rewrite /resume.pdf to /api/resume/file in dev
        if (url === '/resume.pdf') {
          req.url = '/api/resume/file';
        }

        const effectiveUrl = req.url ? req.url.split('?')[0] : '';

        if (effectiveUrl.startsWith('/api/')) {
          try {
            let handlerPath = '';
            if (effectiveUrl === '/api/auth/login') handlerPath = './api/auth/login.ts';
            else if (effectiveUrl === '/api/auth/logout') handlerPath = './api/auth/logout.ts';
            else if (effectiveUrl === '/api/auth/me') handlerPath = './api/auth/me.ts';
            else if (effectiveUrl === '/api/resume') handlerPath = './api/resume/index.ts';
            else if (effectiveUrl === '/api/resume/file') handlerPath = './api/resume/file.ts';
            else if (effectiveUrl === '/api/resume/upload-token') handlerPath = './api/resume/upload-token.ts';
            else if (effectiveUrl === '/api/resume/finalize') handlerPath = './api/resume/finalize.ts';

            if (handlerPath) {
              const module = await server.ssrLoadModule(handlerPath);
              if (module.default) {
                if (!res.status) {
                  res.status = (code: number) => {
                    res.statusCode = code;
                    return res;
                  };
                }
                if (!res.json) {
                  res.json = (data: any) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                    return res;
                  };
                }
                return await module.default(req, res);
              }
            }
          } catch (err: unknown) {
            console.error('Local API dev server error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Server Error' })
            );
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), apiDevPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
})
