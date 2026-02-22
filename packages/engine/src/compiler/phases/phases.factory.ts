import { LexerPhase } from './lexer.phase'
import { ParserPhase } from './parser.phase'
import { SemanticPhase } from './semantic.phases'
import type { CompilerPhase } from './types'
import { PluginManager } from '../../plugins/plugin-manager'
import { SemanticAnalyzer } from '../../semantics/analyzer'
import { BUILTIN_PLUGINS } from '../../plugins'
import type { LanguagePlugin } from '../../plugins/language-plugin'

export class PhasesFactory {
  private readonly pluginManager: PluginManager

  constructor() {
    this.pluginManager = new PluginManager()
    BUILTIN_PLUGINS.forEach((p) => this.pluginManager.register(p))
  }

  public getPlugin(): LanguagePlugin | undefined {
    return this.pluginManager.getActive()
  }

  public getPhases(): CompilerPhase[] {
    const analyzer = new SemanticAnalyzer(this.pluginManager)
    return [new LexerPhase(), new ParserPhase(), new SemanticPhase(analyzer)]
  }
}
