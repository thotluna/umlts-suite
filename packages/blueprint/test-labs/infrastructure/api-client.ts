import { EntityStatus } from '../domain/entities'

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export interface RequestConfig {
  headers?: Record<string, string>
  timeout: number
  retries: number
}

export abstract class BaseClient {
  protected abstract baseUrl: string
  protected static readonly DEFAULT_TIMEOUT = 5000

  protected constructor(protected config: RequestConfig) {}

  public abstract getStatus(): Promise<EntityStatus>
}

export class UserClient extends BaseClient {
  protected baseUrl = 'https://api.example.com/users'

  async getStatus(): Promise<EntityStatus> {
    return 'active' as EntityStatus
  }

  static createDefault(): UserClient {
    return new UserClient({ timeout: 1000, retries: 3 })
  }
}
