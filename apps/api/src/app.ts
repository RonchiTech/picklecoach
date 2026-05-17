import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorMiddleware } from './middleware/error.middleware'
import { notFoundMiddleware } from './middleware/notFound.middleware'
import { authRoutes } from './modules/auth/auth.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { studentRoutes } from './modules/student/student.routes'
import { sessionRoutes } from './modules/session/session.routes'
import { paymentRoutes } from './modules/payment/payment.routes'
import { coachProfileRoutes } from './modules/coach-profile/coach-profile.routes'
import { publicCoachesRoutes } from './modules/public-coaches/public-coaches.routes'
import { subscriptionRoutes } from './modules/subscription/subscription.routes'
import { env } from './config/env'

export function createApp() {
  const app = express()

  const allowedOrigin =
    env.NODE_ENV === 'development'
      ? (origin: string | undefined, cb: (e: Error | null, allow?: boolean) => void) => {
          if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) cb(null, true)
          else cb(new Error('Not allowed by CORS'))
        }
      : env.CLIENT_URL
  app.use(cors({ origin: allowedOrigin, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } })
  })

  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/subscriptions', subscriptionRoutes)
  app.use('/api/v1/dashboard', dashboardRoutes)
  app.use('/api/v1/students', studentRoutes)
  app.use('/api/v1/sessions', sessionRoutes)
  app.use('/api/v1/payments', paymentRoutes)
  app.use('/api/v1/coach-profiles', coachProfileRoutes)
  app.use('/api/v1/coaches', publicCoachesRoutes)

  app.use(notFoundMiddleware)
  app.use(errorMiddleware)

  return app
}
