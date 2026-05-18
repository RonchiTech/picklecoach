import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { UserRepository } from './auth.repository'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { authenticate } from '../../middleware/auth.middleware'
import { env } from '../../config/env'
import { CoachProfileRepository } from '../coach-profile/coach-profile.repository'
import { CoachProfileService } from '../coach-profile/coach-profile.service'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 10000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many attempts, please try again later.' },
  },
})

const router = Router()
const repo = new UserRepository()
const coachProfileRepo = new CoachProfileRepository()
const coachProfileService = new CoachProfileService(coachProfileRepo)
const service = new AuthService(repo, (userId, name) =>
  coachProfileService.createForCoach(userId, name)
)
const controller = new AuthController(service)

router.post('/register', authLimiter, controller.register)
router.post('/login', authLimiter, controller.login)
router.post('/logout', controller.logout)
router.get('/me', authenticate, controller.me)
router.patch('/profile', authenticate, controller.updateProfile)
router.patch('/password', authenticate, controller.changePassword)
router.patch('/goal', authenticate, controller.updateGoal)
router.post('/forgot-password', authLimiter, controller.forgotPassword)
router.post('/reset-password', controller.resetPassword)
router.delete('/account', authenticate, controller.deleteAccount)

export { router as authRoutes }
