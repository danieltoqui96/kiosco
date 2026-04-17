import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { PORT } from './config/env.js';
import { responseMiddleware } from './middlewares/response.middleware.js';
import { registerRoutes } from './routes/index.js';

const app = express();

app.use(express.json());
app.use(cors(corsOptions));
app.use(responseMiddleware);
registerRoutes(app);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
