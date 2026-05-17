import { Router } from 'express'
import { SubscriptionRepository } from './subscription.repository'
import { SubscriptionService } from './subscription.service'
import { SubscriptionController } from './subscription.controller'
import { authenticate } from '../../middleware/auth.middleware'

const router = Router()
const repo = new SubscriptionRepository()
const service = new SubscriptionService(repo)
const controller = new SubscriptionController(service)

router.get('/me', authenticate, controller.getMySubscription)

export { router as subscriptionRoutes }
