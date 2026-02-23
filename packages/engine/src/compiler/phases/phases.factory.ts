import { LexerPhase } from '@engine/compiler/phases/lexer.phase'
import { ParserPhase } from '@engine/compiler/phases/parser.phase'
import { SemanticPhase } from '@engine/compiler/phases/semantic.phases'
import type { CompilerPhase } from '@engine/compiler/phases/types'
import { PluginManager } from '@engine/plugins/plugin-manager'
import { BUILTIN_PLUGINS } from '@engine/plugins'
import type { LanguagePlugin } from '@engine/plugins/language-plugin'

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
    return [new LexerPhase(), new ParserPhase(), new SemanticPhase(this.pluginManager)]
  }
}
