import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { sendSuccess } from './utils/response';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import policiesRoutes from './routes/policies.routes';
import membersRoutes from './routes/members.routes';
import claimsRoutes from './routes/claims.routes';
import knowledgeRoutes from './routes/knowledge.routes';
import auditRoutes from './routes/audit.routes';

export const app = express();

// --- Security & parsing middleware ---
app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Health check ---
app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok', env: env.nodeEnv });
});

// --- API docs ---
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/openapi.json', (_req, res) => res.json(swaggerSpec));

// --- Routes ---
app.use('/auth', authRoutes);
app.use('/policies', policiesRoutes);
app.use('/members', membersRoutes);
app.use('/claims', claimsRoutes);
app.use('/knowledge', knowledgeRoutes);
app.use('/audit', auditRoutes);

// --- 404 + error handling (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

// Only start listening when run directly (not when imported by tests).
if (require.main === module) {
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Atlas Insurance API listening on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`📚 API docs available at http://localhost:${env.port}/docs`);
  });
}
