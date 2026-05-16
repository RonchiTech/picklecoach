import { Router } from 'express'
import multer from 'multer'
import { CoachProfileRepository } from './coach-profile.repository'
import { CoachProfileService } from './coach-profile.service'
import { CoachProfileController } from './coach-profile.controller'
import { authenticate } from '../../middleware/auth.middleware'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
})

const router = Router()
const repo = new CoachProfileRepository()
const service = new CoachProfileService(repo)
const controller = new CoachProfileController(service)

router.get('/me', authenticate, controller.getMe)
router.patch('/me', authenticate, controller.updateMe)
router.post('/me/photo', authenticate, upload.single('photo'), controller.uploadPhoto)

export { router as coachProfileRoutes }
