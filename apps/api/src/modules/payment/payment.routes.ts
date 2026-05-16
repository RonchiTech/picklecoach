import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import { PaymentRepository } from './payment.repository'
import { PaymentService } from './payment.service'
import { PaymentController } from './payment.controller'

const router = Router()
const repo = new PaymentRepository()
const service = new PaymentService(repo)
const controller = new PaymentController(service)

router.use(authenticate)
router.get('/', controller.list)
router.post('/', controller.create)
router.get('/:id', controller.getOne)
router.patch('/:id', controller.update)
router.delete('/:id', controller.delete)

export { router as paymentRoutes }
