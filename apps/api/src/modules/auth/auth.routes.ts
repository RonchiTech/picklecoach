import { Router } from 'express'
import { UserRepository } from './auth.repository'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { authenticate } from '../../middleware/auth.middleware'

const router = Router()
const repo = new UserRepository()
const service = new AuthService(repo)
const controller = new AuthController(service)

router.post('/register', controller.register)
router.post('/login', controller.login)
router.post('/logout', controller.logout)
router.get('/me', authenticate, controller.me)
router.patch('/profile', authenticate, controller.updateProfile)
router.patch('/password', authenticate, controller.changePassword)

export { router as authRoutes }
