import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import { SessionRepository } from './session.repository'
import { SessionService } from './session.service'
import { SessionController } from './session.controller'

const router = Router()
const repo = new SessionRepository()
const service = new SessionService(repo)
const controller = new SessionController(service)

router.use(authenticate)
router.get('/', controller.list)
router.post('/', controller.create)
router.get('/:id', controller.getOne)
router.patch('/:id', controller.update)

export { router as sessionRoutes }
