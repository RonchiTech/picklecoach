import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorMiddleware } from './middleware/error.middleware'
import { notFoundMiddleware } from './middleware/notFound.middleware'
import { env } from './config/env'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } })
  })

  // Routes mounted here in future plans
  // app.use('/api/v1/auth', authRoutes)

  app.use(notFoundMiddleware)
  app.use(errorMiddleware)

  return app
}
