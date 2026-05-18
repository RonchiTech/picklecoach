import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/auth.middleware'
import { AdminRepository } from './admin.repository'
import { AdminController } from './admin.controller'

const router = Router()
const repo = new AdminRepository()
const controller = new AdminController(repo)

router.use(authenticate, requireRole('super_admin'))

router.get('/stats', controller.getStats)
router.get('/coaches', controller.listCoaches)
router.patch('/coaches/:id/subscription', controller.updateCoachSubscription)

export { router as adminRoutes }
