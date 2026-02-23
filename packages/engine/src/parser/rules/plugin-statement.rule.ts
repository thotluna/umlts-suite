import type { StatementNode } from '@engine/syntax/nodes'
import type { LanguagePlugin, IPluginStatementRule } from '@engine/plugins/language-plugin'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { StatementRule, Orchestrator } from '@engine/parser/rule.types'

/**
 * Master Rule for plugin statements.
 * Orchestrates multiple granular rules provided by the plugin.
 */
export class PluginStatementRule implements StatementRule {
  private readonly rules: IPluginStatementRule[]

  constructor(plugin: LanguagePlugin) {
    this.rules = plugin.getStatementRules?.() ?? []
  }

  public canHandle(context: IParserHub): boolean {
    return this.rules.some((rule) => rule.canHandle(context))
  }

  public parse(context: IParserHub, orchestrator: Orchestrator): StatementNode[] {
    for (const rule of this.rules) {
      if (rule.canHandle(context)) {
        const result = rule.parse(context, orchestrator)
        if (result) {
          return result
        }
      }
    }
    return []
  }
}
