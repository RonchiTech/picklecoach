import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import { StudentRepository } from './student.repository'
import { StudentService } from './student.service'
import { StudentController } from './student.controller'

const router = Router()
const repo = new StudentRepository()
const service = new StudentService(repo)
const controller = new StudentController(service)

router.use(authenticate)
router.get('/', controller.list)
router.post('/', controller.create)
router.get('/:id', controller.getOne)
router.patch('/:id', controller.update)
router.delete('/:id', controller.archive)

export { router as studentRoutes }
