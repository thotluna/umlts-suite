import { SymbolTable } from '@engine/semantics/symbol-table'

/**
 * Manages the semantic configuration.
 */
export class ConfigStore {
  private config: Record<string, unknown> = {}

  constructor(private readonly symbolTable: SymbolTable) {}

  /**
   * Merges new configuration options into the store.
   * @param options The configuration options to merge.
   */
  public merge(options: Record<string, unknown>): void {
    this.config = { ...this.config, ...options }
  }

  /**
   * Returns a copy of the current configuration.
   */
  public get(): Record<string, unknown> {
    return { ...this.config }
  }
}
