import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/auth.middleware'
import { PromotionRepository } from './promotion.repository'
import { PromotionService } from './promotion.service'
import { PromotionController } from './promotion.controller'

const router = Router()
const promoRepo = new PromotionRepository()
const service = new PromotionService(promoRepo)
const controller = new PromotionController(service)

// Coach: validate a promo code before submitting upgrade request
router.post('/validate', authenticate, controller.validate)

// Admin only
router.get('/', authenticate, requireRole('super_admin'), controller.list)
router.post('/', authenticate, requireRole('super_admin'), controller.create)
router.patch('/:id', authenticate, requireRole('super_admin'), controller.update)
router.delete('/:id', authenticate, requireRole('super_admin'), controller.deactivate)

export { router as promotionRoutes }
