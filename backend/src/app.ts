import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { PORT } from './config/env.js';
import { responseMiddleware } from './middlewares/response.middleware.js';
import { registerRoutes } from './routes/index.js';
import { ensureAppSchema } from './db/schema-sync.js';

const app = express();

app.use(express.json());
app.use(cors(corsOptions));
app.use(responseMiddleware);
registerRoutes(app);

async function startServer() {
  await ensureAppSchema();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

void startServer().catch((error) => {
  console.error('Failed to start server:', error);
  if (process.env.KIOSCO_ELECTRON === '1') {
    throw error;
  }

  process.exit(1);
});
