import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { router as apiRouter } from './server/routes/api';
import { WorkflowScheduler } from './server/services/workflowScheduler';

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount API routes
app.use('/api', apiRouter);

// Direct top-level webhook route (e.g. POST /webhook/wh_lead_inbound) forwarding to /api/webhook/:path
app.all('/webhook/:path', (req: Request, res: Response, next) => {
  req.url = `/webhook/${req.params.path}`;
  apiRouter(req, res, next);
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const server = http.createServer(app);

  if (!isProd) {
    // In development mode, mount Vite middleware for instant HMR and React serving
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[EIE-Workflow] Vite middleware attached for development.');
  } else {
    // In production, serve the built dist directory
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[EIE-Workflow] Serving production build from /dist.');
  }

  server.listen(PORT, HOST, () => {
    console.log(`[EIE-Workflow] Server running at http://${HOST}:${PORT}`);
    WorkflowScheduler.start();
  });
}

startServer().catch((err) => {
  console.error('[EIE-Workflow] Fatal server startup failure:', err);
  process.exit(1);
});
