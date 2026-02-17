import { User, Organization } from './entities'

export type PaymentMethod = 'credit_card' | 'paypal' | 'transfer'

export type Config = {
  apiUrl: string
  attempts: number
  debug: boolean
}

export interface Repository<T> {
  save(entity: T): void
  findById(id: string): T | null
}

export class BaseRepository {
  protected connection: string = 'postgres://localhost:5432/db'
}

export class UserRepository extends BaseRepository implements Repository<User> {
  save(user: User): void {
    console.log('Saving user ' + user.name + ' to ' + this.connection)
  }

  findById(_id: string): User | null {
    return null
  }
}

export class MultiRepo {
  // Ejemplo de Unión de tipos (Polimorfismo estructural)
  public sync(target: User | Organization): void {
    console.log('Syncing: ' + target.getId())
  }
}
