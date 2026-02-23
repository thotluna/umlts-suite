import { TypeScriptPlugin } from '@engine/plugins/typescript/typescript.plugin'
import type { LanguagePlugin } from '@engine/plugins/language-plugin'

/**
 * Registry of all built-in language plugins.
 * In a more advanced system, this could be loaded dynamically or via a plugin discovery system.
 */
export const BUILTIN_PLUGINS: LanguagePlugin[] = [
  new TypeScriptPlugin(),
  // Add more plugins here as they are developed
]
