import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import { connectDatabase } from './config/database.js'
import { handleError } from './middlewares/http.js'
import authRoutes from './routes/auth.routes.js'
import catalogRoutes from './routes/catalog.routes.js'
import appointmentRoutes from './routes/appointments.routes.js'
import { ApiError } from './utils/api-error.js'

const app = express()
app.disable('x-powered-by')
if (process.env.VERCEL === '1') app.set('trust proxy', 1)
app.use(helmet({ referrerPolicy: { policy: 'no-referrer' } }))
app.use(
  cors({
    origin: (origin, done) => done(null, !origin || origin === env.CLIENT_ORIGIN),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json({ limit: '12kb' }))
app.get('/api/health', (_req, res) => res.json({ data: { status: 'ok' } }))
app.get('/api/ready', async (_req, res) => {
  const connection = await connectDatabase()
  await connection.connection.db.admin().ping()
  res.json({ data: { database: 'ready' } })
})
app.use('/api', async (_req, _res, next) => {
  await connectDatabase()
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/services', catalogRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use((_req, _res, next) =>
  next(new ApiError(404, 'Ruta no encontrada.', 'NOT_FOUND')),
)
app.use(handleError)
export default app
