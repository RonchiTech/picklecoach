import { Router } from 'express'
import { authenticate, requireProOrTrial } from '../../middleware/auth.middleware'
import { ProgressEntryRepository } from './progress-entry.repository'
import { ProgressEntryService } from './progress-entry.service'
import { ProgressEntryController } from './progress-entry.controller'

const router = Router()
const repo = new ProgressEntryRepository()
const service = new ProgressEntryService(repo)
const controller = new ProgressEntryController(service)

router.use(authenticate)
router.use(requireProOrTrial)
router.get('/', controller.list)
router.post('/', controller.create)
router.patch('/:id', controller.update)
router.delete('/:id', controller.delete)

export { router as progressEntryRoutes }
