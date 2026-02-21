import type { LanguagePlugin } from './language-plugin'

/**
 * Orchestrates language plugins within the engine.
 */
export class PluginManager {
  private readonly plugins = new Map<string, LanguagePlugin>()
  private activePlugin: LanguagePlugin | undefined

  /**
   * Registers a new language plugin.
   */
  public register(plugin: LanguagePlugin): void {
    this.plugins.set(plugin.name.toLowerCase(), plugin)
  }

  /**
   * Activates a plugin by its name.
   */
  public activate(name: string): void {
    const plugin = this.plugins.get(name.toLowerCase())
    if (plugin) {
      this.activePlugin = plugin
    }
  }

  /**
   * Returns the currently active plugin, if any.
   */
  public getActive(): LanguagePlugin | undefined {
    return this.activePlugin
  }

  /**
   * Checks if a specific language is supported.
   */
  public supports(name: string): boolean {
    return this.plugins.has(name.toLowerCase())
  }
}
