import { v2 as cloudinary } from 'cloudinary'
import { BUNDLE_PRICES } from '@picklecoach/shared'
import type { UpgradeRequestRepository } from './upgrade-request.repository'
import type { PromotionRepository } from '../promotion/promotion.repository'
import type { IUpgradeRequest } from './upgrade-request.model'
import { User } from '../auth/auth.model'
import { Redemption, Promotion } from '../promotion/promotion.model'
import { createError } from '../../middleware/error.middleware'
import { env } from '../../config/env'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

function uploadToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'picklecoach/receipts', resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

type SubmitInput = {
  coachId: string
  months: number
  promoCode?: string
  receiptBuffer: Buffer
}

export class UpgradeRequestService {
  constructor(
    private repo: UpgradeRequestRepository,
    private promoRepo: PromotionRepository
  ) {}

  async submit(input: SubmitInput): Promise<IUpgradeRequest> {
    const existing = await this.repo.findPendingByCoach(input.coachId)
    if (existing) {
      throw createError(
        'You already have a pending upgrade request. Please wait for admin review.',
        409,
        'PENDING_REQUEST_EXISTS'
      )
    }

    const baseAmount = BUNDLE_PRICES[input.months] ?? 149
    let discountApplied = 0

    if (input.promoCode) {
      const promo = await this.promoRepo.findByCode(input.promoCode)
      if (promo && promo.isActive) {
        if (promo.discountType === 'percentage') {
          discountApplied = Math.floor(baseAmount * (promo.discountValue / 100))
        } else {
          discountApplied = Math.min(promo.discountValue, baseAmount)
        }
      }
    }

    const receiptUrl = await uploadToCloudinary(input.receiptBuffer)

    return this.repo.create({
      coachId: input.coachId,
      months: input.months,
      amountDue: baseAmount - discountApplied,
      discountApplied,
      promoCode: input.promoCode,
      receiptUrl,
    })
  }

  async getMine(coachId: string): Promise<IUpgradeRequest | null> {
    return this.repo.findByCoach(coachId)
  }

  async approve(requestId: string, adminId: string, notes?: string): Promise<void> {
    const request = await this.repo.findById(requestId)
    if (!request) throw createError('Request not found', 404, 'NOT_FOUND')
    if (request.status !== 'pending') {
      throw createError('Request has already been reviewed', 409, 'ALREADY_REVIEWED')
    }

    const proEndsAt = new Date()
    proEndsAt.setDate(proEndsAt.getDate() + request.months * 30)

    await User.findByIdAndUpdate(request.coachId, {
      subscriptionTier: 'pro',
      subscriptionStatus: 'active',
      proEndsAt,
    })

    if (request.promoCode) {
      const promo = await this.promoRepo.findByCode(request.promoCode)
      if (promo) {
        await Redemption.create({
          promotionId: promo._id,
          coachId: request.coachId,
          discountApplied: request.discountApplied,
        })
        await Promotion.findByIdAndUpdate(promo._id, { $inc: { currentRedemptions: 1 } })
      }
    }

    await this.repo.approve(requestId, { notes, reviewedBy: adminId })
  }

  async reject(requestId: string, adminId: string, notes?: string): Promise<void> {
    const request = await this.repo.findById(requestId)
    if (!request) throw createError('Request not found', 404, 'NOT_FOUND')
    if (request.status !== 'pending') {
      throw createError('Request has already been reviewed', 409, 'ALREADY_REVIEWED')
    }
    await this.repo.reject(requestId, { notes, reviewedBy: adminId })
  }

  async listAll() {
    return this.repo.listAll()
  }
}
