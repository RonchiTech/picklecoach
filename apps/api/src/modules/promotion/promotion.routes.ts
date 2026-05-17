import { Router } from 'express'
import { authenticate, requireActive, requireRole } from '../../middleware/auth.middleware'
import { PromotionRepository, UserUpgradeRepository } from './promotion.repository'
import { PromotionService } from './promotion.service'
import { PromotionController } from './promotion.controller'

const router = Router()
const promoRepo = new PromotionRepository()
const userRepo = new UserUpgradeRepository()
const service = new PromotionService(promoRepo, userRepo)
const controller = new PromotionController(service)

router.post('/apply', authenticate, requireActive, controller.apply)

router.get('/', authenticate, requireRole('super_admin'), controller.list)
router.post('/', authenticate, requireRole('super_admin'), controller.create)
router.patch('/:id', authenticate, requireRole('super_admin'), controller.update)
router.delete('/:id', authenticate, requireRole('super_admin'), controller.deactivate)

export { router as promotionRoutes }
