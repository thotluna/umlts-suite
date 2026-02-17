import { User } from '../domain/entities'

export interface UpdateUserRequest {
  id: string
  data: Partial<User> | null
}

export class UpdateUserUseCase {
  async execute(_request: UpdateUserRequest): Promise<User> {
    // ... logic
    return {} as User
  }

  async patch(_id: string, _partialData: Partial<User>): Promise<void> {
    // ... logic
  }
}
