import { Router } from 'express'
import multer from 'multer'
import { authenticate } from '../../middleware/auth.middleware'
import { PlatformSettingsRepository } from './platform-settings.repository'
import { PlatformSettingsController } from './platform-settings.controller'

const repo = new PlatformSettingsRepository()
const controller = new PlatformSettingsController(repo)

// Coach-accessible: read GCash details to display on upgrade page
const router = Router()
router.get('/gcash', authenticate, controller.getGcash)
export { router as settingsRoutes }

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })

// Admin-only: read + write GCash config
const adminRouter = Router()
adminRouter.get('/gcash', controller.getGcash)
adminRouter.put('/gcash', upload.single('qr'), controller.updateGcash)
export { adminRouter as adminSettingsRoutes }
