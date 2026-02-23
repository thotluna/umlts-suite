import type { MemberNode } from '../../syntax/nodes'
import type { LanguagePlugin, IPluginMemberProvider } from '../../plugins/language-plugin'
import type { IParserHub } from '../core/parser.hub'
import type { IMemberProvider } from '../core/member-provider.interface'
import { Orchestrator } from '../rule.types'

/**
 * Master Provider for plugin members.
 * Orchestrates multiple granular providers provided by the plugin.
 */
export class PluginMemberProvider implements IMemberProvider {
  private readonly providers: IPluginMemberProvider[]

  constructor(plugin: LanguagePlugin) {
    this.providers = plugin.getMemberRules?.() ?? []
  }

  public canHandle(context: IParserHub): boolean {
    return this.providers.some((provider) => provider.canHandle(context))
  }

  public parse(context: IParserHub, orchestrator: Orchestrator): MemberNode | null {
    for (const provider of this.providers) {
      if (provider.canHandle(context)) {
        const result = provider.parse(context, orchestrator)
        if (result) {
          return result
        }
      }
    }
    return null
  }
}
