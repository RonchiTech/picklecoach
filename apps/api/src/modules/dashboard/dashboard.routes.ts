import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import { DashboardService } from './dashboard.service'
import { DashboardController } from './dashboard.controller'

const router = Router()
const service = new DashboardService()
const controller = new DashboardController(service)

router.get('/stats', authenticate, controller.getStats)

export { router as dashboardRoutes }
