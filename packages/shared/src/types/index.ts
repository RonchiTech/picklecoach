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
