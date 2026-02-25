import { CompilerContext } from '@engine/compiler/phases/context'
import { PhasesFactory } from '@engine/compiler/phases/phases.factory'
import { PipelineArtifacts } from '@engine/compiler/phases/pipeline-artifacts'
import { ParseResult } from '@engine/generator/types'
import { Token } from '@engine/syntax/token.types'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { IUMLPlugin } from './plugin/plugin.types'
import { PluginRegistry } from './plugin/plugin.registry'

export class UMLEngine {
  private readonly factory = new PhasesFactory()
  private readonly phases = this.factory.getPhases()
  private readonly registry: PluginRegistry

  constructor(plugins: IUMLPlugin[] = []) {
    this.registry = new PluginRegistry(plugins)
  }

  public parse(source: string): ParseResult {
    const context = new CompilerContext(source, this.registry)
    const artifacts = new PipelineArtifacts()

    for (const phase of this.phases) {
      phase.run(context, artifacts)
      if (context.hasErrors()) break
    }

    return {
      ast: artifacts.ast || undefined,
      diagram: artifacts.diagram!,
      diagnostics: context.getDiagnostics(),
      isValid: !context.hasErrors(),
    }
  }

  /**
   * getTokens: Utility for testing and debugging. Returns the list of tokens for a given source.
   */
  public getTokens(source: string): Token[] {
    const pluginMatchers = this.registry.language.getMatchers()
    return LexerFactory.create(source, pluginMatchers).tokenize()
  }

  /**
   * Cleanup method to release plugin resources.
   */
  public destroy(): void {
    this.registry.destroy()
  }
}
