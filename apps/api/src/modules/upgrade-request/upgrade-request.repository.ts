import type { PublicUpgradeRequest } from '@picklecoach/shared'
import { UpgradeRequest } from './upgrade-request.model'
import type { IUpgradeRequest } from './upgrade-request.model'

type CreateData = {
  coachId: string
  months: number
  amountDue: number
  discountApplied: number
  promoCode?: string
  receiptUrl: string
}

type ReviewData = { notes?: string; reviewedBy?: string }

type PopulatedCoach = { _id: { toString(): string }; name: string; email: string }

export class UpgradeRequestRepository {
  async create(data: CreateData): Promise<IUpgradeRequest> {
    return UpgradeRequest.create(data)
  }

  async findPendingByCoach(coachId: string): Promise<IUpgradeRequest | null> {
    return UpgradeRequest.findOne({ coachId, status: 'pending' })
  }

  async findById(id: string): Promise<IUpgradeRequest | null> {
    return UpgradeRequest.findById(id)
  }

  async findByCoach(coachId: string): Promise<IUpgradeRequest | null> {
    return UpgradeRequest.findOne({ coachId }).sort({ createdAt: -1 })
  }

  async listAll(): Promise<PublicUpgradeRequest[]> {
    type Row = Omit<IUpgradeRequest, 'coachId'> & { coachId: PopulatedCoach }
    const docs = await UpgradeRequest.find()
      .populate<{ coachId: PopulatedCoach }>('coachId', 'name email')
      .sort({ createdAt: -1 })
      .lean<Row[]>()

    return docs.map((d) => ({
      _id: d._id.toString(),
      coachId: d.coachId._id.toString(),
      coachName: d.coachId.name,
      coachEmail: d.coachId.email,
      months: d.months,
      amountDue: d.amountDue,
      discountApplied: d.discountApplied,
      promoCode: d.promoCode,
      receiptUrl: d.receiptUrl,
      status: d.status,
      notes: d.notes,
      createdAt: (d.createdAt as unknown as Date).toISOString(),
      reviewedAt: d.reviewedAt instanceof Date ? d.reviewedAt.toISOString() : undefined,
    }))
  }

  async approve(id: string, data: ReviewData): Promise<void> {
    await UpgradeRequest.findByIdAndUpdate(id, {
      status: 'approved',
      notes: data.notes,
      reviewedAt: new Date(),
      reviewedBy: data.reviewedBy,
    })
  }

  async reject(id: string, data: ReviewData): Promise<void> {
    await UpgradeRequest.findByIdAndUpdate(id, {
      status: 'rejected',
      notes: data.notes,
      reviewedAt: new Date(),
      reviewedBy: data.reviewedBy,
    })
  }
}
