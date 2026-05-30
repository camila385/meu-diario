import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@/config/swagger';
import { errorMiddleware } from '@/middlewares/error.middleware';
import apiRoutes from '@/routes/index';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1', apiRoutes);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorMiddleware);

export default app;
