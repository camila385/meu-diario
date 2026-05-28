import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from '@/config/swagger'
import { errorMiddleware } from '@/middlewares/error.middleware'
import apiRoutes from '@/routes/index'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Documentação
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Rotas
app.use('/api/v1', apiRoutes)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler — deve ser o último middleware
app.use(errorMiddleware)

export default app
