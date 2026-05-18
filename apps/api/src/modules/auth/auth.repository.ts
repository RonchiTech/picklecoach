import { IUser, User } from './auth.model'

export interface IAuthRepository {
  findByEmail(email: string): Promise<IUser | null>
  findById(id: string): Promise<IUser | null>
  create(data: {
    name: string
    email: string
    passwordHash: string
    phone?: string
  }): Promise<IUser>
  emailExists(email: string): Promise<boolean>
  update(id: string, data: { name?: string; phone?: string }): Promise<IUser | null>
  updatePassword(id: string, passwordHash: string): Promise<void>
  setResetToken(id: string, tokenHash: string, expiresAt: Date): Promise<void>
  findByResetToken(tokenHash: string): Promise<IUser | null>
  clearResetToken(id: string): Promise<void>
  deleteById(id: string): Promise<void>
}

export class UserRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email })
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id)
  }

  async create(data: {
    name: string
    email: string
    passwordHash: string
    phone?: string
  }): Promise<IUser> {
    return User.create(data)
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email })
    return count > 0
  }

  async update(id: string, data: { name?: string; phone?: string }): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { $set: data }, { new: true })
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await User.updateOne({ _id: id }, { $set: { passwordHash } })
  }

  async setResetToken(id: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await User.updateOne(
      { _id: id },
      { $set: { resetPasswordToken: tokenHash, resetPasswordExpiresAt: expiresAt } }
    )
  }

  async findByResetToken(tokenHash: string): Promise<IUser | null> {
    return User.findOne({ resetPasswordToken: tokenHash }).select(
      '+resetPasswordToken +resetPasswordExpiresAt'
    )
  }

  async clearResetToken(id: string): Promise<void> {
    await User.updateOne(
      { _id: id },
      { $unset: { resetPasswordToken: '', resetPasswordExpiresAt: '' } }
    )
  }

  async deleteById(id: string): Promise<void> {
    await User.deleteOne({ _id: id })
  }
}
