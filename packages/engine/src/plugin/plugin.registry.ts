import type { IUMLPlugin } from './plugin.types'
import { LanguageExtension } from './language.extension'

/**
 * PluginRegistry: Generic container for plugins and their extension points.
 * It manages the lifecycle and provides access to specialized extension containers.
 */
export class PluginRegistry {
  private readonly plugins: IUMLPlugin[] = []

  /**
   * Specialized extensions (Extension Points).
   * These are explicitly registered to keep the Registry generic but type-safe.
   */
  public readonly language = new LanguageExtension()

  constructor(plugins: IUMLPlugin[] = []) {
    this.plugins = plugins

    // Initialize required extensions
    this.language.ensureInitialized(this.plugins)
  }

  /**
   * Cleanup all plugins.
   */
  public destroy(): void {
    for (const plugin of this.plugins) {
      plugin.onDestroy?.()
    }
  }
}
