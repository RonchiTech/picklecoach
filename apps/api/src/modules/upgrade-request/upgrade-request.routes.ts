import { Router } from 'express'
import multer from 'multer'
import { authenticate, requireRole } from '../../middleware/auth.middleware'
import { UpgradeRequestRepository } from './upgrade-request.repository'
import { UpgradeRequestService } from './upgrade-request.service'
import { UpgradeRequestController } from './upgrade-request.controller'
import { PromotionRepository } from '../promotion/promotion.repository'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const repo = new UpgradeRequestRepository()
const promoRepo = new PromotionRepository()
const service = new UpgradeRequestService(repo, promoRepo)
const controller = new UpgradeRequestController(service)

// Coach routes
router.post('/', authenticate, upload.single('receipt'), controller.submit)
router.get('/mine', authenticate, controller.getMine)

// Admin routes
router.get('/', authenticate, requireRole('super_admin'), controller.listAll)
router.patch('/:id/review', authenticate, requireRole('super_admin'), controller.review)

export { router as upgradeRequestRoutes }
