/**
 * Represents a single code unit found during the discovery phase.
 */
export interface SourceUnit {
  readonly uri: string
  readonly name: string
  readonly size: number
}

/**
 * Interface that all source discovery strategies must implement.
 * This allows the system to scale to URLs, Git repos, etc.
 */
export interface SourceProvider {
  /**
   * Determines if this provider can handle the given input string.
   */
  canHandle(input: string): boolean

  /**
   * Discovers and returns all source units from the given input.
   */
  lookup(input: string): Promise<SourceUnit[]>
}
