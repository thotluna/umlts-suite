import { SourceProvider, SourceUnit } from './types'

export interface DiscoveryReport {
  units: SourceUnit[]
  totalFiles: number
  totalSize: number
}

/**
 * Service that orchestrates different providers to discover source code.
 */
export class DiscoveryService {
  private providers: SourceProvider[] = []

  public registerProvider(provider: SourceProvider): void {
    this.providers.push(provider)
  }

  /**
   * Orchestrates the lookup process using the registered providers.
   */
  public async discover(input: string): Promise<DiscoveryReport> {
    const provider = this.providers.find((p) => p.canHandle(input))

    if (!provider) {
      throw new Error(`No provider found for input: ${input}`)
    }

    const units = await provider.lookup(input)

    return {
      units,
      totalFiles: units.length,
      totalSize: units.reduce((acc, unit) => acc + unit.size, 0),
    }
  }
}
