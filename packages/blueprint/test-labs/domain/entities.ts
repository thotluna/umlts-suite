export type EntityStatus = 'active' | 'inactive' | 'pending'

export class BaseEntity {
  private id: string = 'uuid-v4'
  public status: EntityStatus = 'pending'

  getId(): string {
    return this.id
  }
}

export class User extends BaseEntity {
  public name: string = 'Unknown'
}

export class Organization extends BaseEntity {
  public taxId: string = '000-000'
}
