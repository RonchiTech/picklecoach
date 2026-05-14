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
}
