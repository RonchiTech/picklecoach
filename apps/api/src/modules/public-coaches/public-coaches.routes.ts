import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { PublicCoachesRepository } from './public-coaches.repository'
import { PublicCoachesService } from './public-coaches.service'
import { PublicCoachesController } from './public-coaches.controller'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

const router = Router()
const repo = new PublicCoachesRepository()
const service = new PublicCoachesService(repo)
const controller = new PublicCoachesController(service)

router.use(limiter)
router.get('/slugs', controller.listSlugs)
router.get('/', controller.list)
router.get('/:slug', controller.getBySlug)

export { router as publicCoachesRoutes }
