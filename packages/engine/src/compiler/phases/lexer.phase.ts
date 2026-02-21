import { LexerFactory } from '../../lexer/lexer.factory'
import type { CompilerContext } from './context'
import type { PipelineArtifacts } from './pipeline-artifacts'
import type { CompilerPhase } from './types'

export class LexerPhase implements CompilerPhase {
  public run(context: CompilerContext, artifacts: PipelineArtifacts): void {
    artifacts.tokens = LexerFactory.create(context.source, context.plugin).tokenize()
  }
}
