import { Router } from 'express'
import { UserRepository } from './auth.repository'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { authenticate } from '../../middleware/auth.middleware'
import { CoachProfileRepository } from '../coach-profile/coach-profile.repository'
import { CoachProfileService } from '../coach-profile/coach-profile.service'

const router = Router()
const repo = new UserRepository()
const coachProfileRepo = new CoachProfileRepository()
const coachProfileService = new CoachProfileService(coachProfileRepo)
const service = new AuthService(repo, (userId, name) =>
  coachProfileService.createForCoach(userId, name)
)
const controller = new AuthController(service)

router.post('/register', controller.register)
router.post('/login', controller.login)
router.post('/logout', controller.logout)
router.get('/me', authenticate, controller.me)
router.patch('/profile', authenticate, controller.updateProfile)
router.patch('/password', authenticate, controller.changePassword)
router.post('/forgot-password', controller.forgotPassword)
router.post('/reset-password', controller.resetPassword)

export { router as authRoutes }
