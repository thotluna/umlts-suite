import type { StatementNode } from '../../syntax/nodes'
import type { LanguagePlugin, IPluginStatementRule } from '../../plugins/language-plugin'
import type { IParserHub } from '../core/parser.hub'
import type { StatementRule, Orchestrator } from '../rule.types'

/**
 * Master Rule for plugin statements.
 * Orchestrates multiple granular rules provided by the plugin.
 */
export class PluginStatementRule implements StatementRule {
  private readonly rules: IPluginStatementRule[]

  constructor(plugin: LanguagePlugin) {
    this.rules = plugin.getStatementRules?.() ?? []
  }

  public canStart(context: IParserHub): boolean {
    return this.rules.some((rule) => rule.canStart(context))
  }

  public parse(context: IParserHub, orchestrator: Orchestrator): StatementNode[] {
    for (const rule of this.rules) {
      if (rule.canStart(context)) {
        const result = rule.parse(context, orchestrator)
        if (result) {
          return result
        }
      }
    }
    return []
  }
}
