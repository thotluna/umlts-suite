import type { MemberNode } from '../../syntax/nodes'
import type { LanguagePlugin, IPluginMemberProvider } from '../../plugins/language-plugin'
import type { ParserContext } from '../parser.context'
import type { IMemberProvider } from './member-strategies/member-strategy.interface'

/**
 * Master Provider for plugin members.
 * Orchestrates multiple granular providers provided by the plugin.
 */
export class PluginMemberProvider implements IMemberProvider {
  private readonly providers: IPluginMemberProvider[]

  constructor(plugin: LanguagePlugin) {
    this.providers = plugin.getMemberRules?.() ?? []
  }

  public canHandle(context: ParserContext): boolean {
    return this.providers.some((provider) => provider.canHandle(context))
  }

  public parse(context: ParserContext): MemberNode | null {
    for (const provider of this.providers) {
      if (provider.canHandle(context)) {
        const result = provider.parse(context)
        if (result) {
          return result
        }
      }
    }
    return null
  }
}
