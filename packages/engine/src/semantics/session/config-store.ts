import { PluginManager } from '../../plugins/plugin-manager'
import { SymbolTable } from '../symbol-table'

/**
 * Manages the semantic configuration and language activation.
 * Extracted from SemanticAnalyzer.
 */
export class ConfigStore {
  private config: Record<string, unknown> = {}

  constructor(
    private readonly pluginManager: PluginManager,
    private readonly symbolTable: SymbolTable,
  ) {}

  /**
   * Merges new configuration options into the store.
   * Triggers language activation if a 'language' option is present.
   * @param options The configuration options to merge.
   */
  public merge(options: Record<string, unknown>): void {
    this.config = { ...this.config, ...options }

    // If a language is specified, activate its plugin
    if (options.language && typeof options.language === 'string') {
      this.activateLanguage(options.language)
    }
  }

  /**
   * Returns a copy of the current configuration.
   */
  public get(): Record<string, unknown> {
    return { ...this.config }
  }

  private activateLanguage(language: string): void {
    if (this.pluginManager.supports(language)) {
      this.pluginManager.activate(language)
      const plugin = this.pluginManager.getActive()
      if (plugin) {
        // Initialize hiddenEntities in config if not present
        if (!this.config.hiddenEntities) {
          this.config.hiddenEntities = []
        }
        const hidden = this.config.hiddenEntities as string[]

        // Load Standard Library into SymbolTable
        plugin.getStandardLibrary().forEach((entity) => {
          this.symbolTable.register(entity)
          // Hide standard library entities by default from rendering
          hidden.push(entity.id)

          // Also register the namespace of the library
          if (entity.namespace) {
            this.symbolTable.registerNamespace(entity.namespace)
          }
        })
      }
    }
  }
}
