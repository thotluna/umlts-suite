import { User } from '../domain/entities'

export type CreateUserDTO = Omit<User, 'id' | 'getId'>
export type UpdateUserDTO = Partial<User>

export class CreateUserUseCase {
  public execute(data: CreateUserDTO): User {
    console.log('Creating user...')
    const user = new User()
    user.name = data.name
    return user
  }

  public patch(id: string, _data: UpdateUserDTO): void {
    console.log('Patching user ' + id)
  }
}
