export type UserRole = 'coach' | 'super_admin'

export type SubscriptionTier = 'starter' | 'pro' | 'team'

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'

export type SessionType = 'private' | 'group'

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'

export type PaymentMethod = 'cash' | 'gcash' | 'bank_transfer' | 'other'

export type PaymentStatus = 'paid' | 'unpaid' | 'partial'

export type ProgressEntryType = 'general' | 'assessment' | 'goal' | 'milestone'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'

export type InquiryStatus = 'new' | 'read' | 'replied'

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface DashboardStats {
  todaySessions: number
  totalStudents: number
  unpaidBalance: number
}

export interface PublicStudent {
  _id: string
  coachId: string
  name: string
  email?: string
  phone?: string
  skillLevel: SkillLevel
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PublicSession {
  _id: string
  coachId: string
  studentIds: string[]
  type: SessionType
  status: SessionStatus
  scheduledAt: string
  durationMinutes: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PublicPayment {
  _id: string
  coachId: string
  studentId: string
  sessionId?: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  notes?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export interface PublicUser {
  _id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  subscriptionTier: SubscriptionTier
  subscriptionStatus: SubscriptionStatus
}

export interface PublicCoachProfile {
  _id: string
  coachId: string
  slug: string
  isPublic: boolean
  displayName: string
  bio?: string
  photoUrl?: string
  city?: string
  specializations: string[]
  sessionTypes: SessionType[]
  privateRate?: number
  groupRate?: number
  ratesNote?: string
  contactEmail?: string
  contactPhone?: string
  showContactInfo: boolean
  totalViews: number
  createdAt: string
  updatedAt: string
}

export interface CoachDirectoryQuery {
  specialization?: string
  city?: string
  sessionType?: string
  page?: number
}

export interface CoachDirectoryResult {
  coaches: PublicCoachProfile[]
  total: number
  page: number
  totalPages: number
}

export interface SubscriptionInfo {
  tier: SubscriptionTier
  status: SubscriptionStatus
  trialEndsAt: string // ISO date — natural end of trial period
  lockedAt: string // trialEndsAt + 7 days — hard lock date
  daysRemaining: number // days until trialEndsAt; 0 if already past
  isLocked: boolean // true when now > lockedAt
}

export interface PublicProgressEntry {
  _id: string
  coachId: string
  studentId: string
  sessionId?: string
  type: ProgressEntryType
  content: string
  skillTags: string[]
  createdAt: string
  updatedAt: string
}

export type DiscountType = 'percentage' | 'fixed'

export interface PublicPromotion {
  _id: string
  code: string
  discountType: DiscountType
  discountValue: number
  applicableTiers: SubscriptionTier[]
  expiresAt?: string
  maxRedemptions?: number
  currentRedemptions: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ApplyPromoResult {
  tier: SubscriptionTier
  discountApplied: number
}
