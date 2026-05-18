import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/auth.middleware'
import { AdminRepository } from './admin.repository'
import { AdminController } from './admin.controller'
import { adminSettingsRoutes } from '../platform-settings/platform-settings.routes'

const router = Router()
const repo = new AdminRepository()
const controller = new AdminController(repo)

router.use(authenticate, requireRole('super_admin'))

router.get('/stats', controller.getStats)
router.get('/revenue', controller.getRevenueSummary)
router.get('/coaches', controller.listCoaches)
router.patch('/coaches/:id/subscription', controller.updateCoachSubscription)
router.use('/settings', adminSettingsRoutes)

export { router as adminRoutes }
