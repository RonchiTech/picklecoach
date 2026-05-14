import { AuthService } from './auth.service'
import type { IAuthRepository } from './auth.repository'
import type { IUser } from './auth.model'

const mockUser = {
  _id: { toString: () => '507f1f77bcf86cd799439011' },
  name: 'Coach Ron',
  email: 'ron@test.com',
  role: 'coach' as const,
  subscriptionTier: 'starter' as const,
  subscriptionStatus: 'trial' as const,
  comparePassword: jest.fn(),
} as unknown as IUser

const mockRepo: jest.Mocked<IAuthRepository> = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  emailExists: jest.fn(),
}

let service: AuthService

beforeEach(() => {
  jest.clearAllMocks()
  service = new AuthService(mockRepo)
})

describe('AuthService.register', () => {
  it('throws EMAIL_TAKEN (409) when email already exists', async () => {
    mockRepo.emailExists.mockResolvedValue(true)
    await expect(
      service.register({ name: 'Ron', email: 'ron@test.com', password: 'password123' })
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN', statusCode: 409 })
  })

  it('hashes password before calling repo.create', async () => {
    mockRepo.emailExists.mockResolvedValue(false)
    mockRepo.create.mockResolvedValue(mockUser)
    await service.register({ name: 'Ron', email: 'ron@test.com', password: 'password123' })
    const call = mockRepo.create.mock.calls[0][0]
    expect(call.passwordHash).not.toBe('password123')
    expect(call.name).toBe('Ron')
  })

  it('returns token and sanitized user without passwordHash', async () => {
    mockRepo.emailExists.mockResolvedValue(false)
    mockRepo.create.mockResolvedValue(mockUser)
    const result = await service.register({
      name: 'Ron',
      email: 'ron@test.com',
      password: 'password123',
    })
    expect(result.token).toBeDefined()
    expect(result.user.email).toBe('ron@test.com')
    expect((result.user as Record<string, unknown>).passwordHash).toBeUndefined()
  })
})

describe('AuthService.login', () => {
  it('throws INVALID_CREDENTIALS (401) when user not found', async () => {
    mockRepo.findByEmail.mockResolvedValue(null)
    await expect(
      service.login({ email: 'ghost@test.com', password: 'password123' })
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 })
  })

  it('throws INVALID_CREDENTIALS when password is wrong', async () => {
    mockRepo.findByEmail.mockResolvedValue(mockUser)
    ;(mockUser.comparePassword as jest.Mock).mockResolvedValue(false)
    await expect(
      service.login({ email: 'ron@test.com', password: 'wrongpassword' })
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
  })

  it('returns token and sanitized user on valid credentials', async () => {
    mockRepo.findByEmail.mockResolvedValue(mockUser)
    ;(mockUser.comparePassword as jest.Mock).mockResolvedValue(true)
    const result = await service.login({ email: 'ron@test.com', password: 'password123' })
    expect(result.token).toBeDefined()
    expect(result.user.role).toBe('coach')
  })
})

describe('AuthService.getById', () => {
  it('throws USER_NOT_FOUND (404) when user does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null)
    await expect(service.getById('unknown-id')).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
      statusCode: 404,
    })
  })

  it('returns sanitized user without passwordHash', async () => {
    mockRepo.findById.mockResolvedValue(mockUser)
    const result = await service.getById('507f1f77bcf86cd799439011')
    expect(result.email).toBe('ron@test.com')
    expect((result as Record<string, unknown>).passwordHash).toBeUndefined()
  })
})
