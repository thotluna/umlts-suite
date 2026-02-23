import { LexerFactory } from '@engine/lexer/lexer.factory'
import type { CompilerContext } from '@engine/compiler/phases/context'
import type { PipelineArtifacts } from '@engine/compiler/phases/pipeline-artifacts'
import type { CompilerPhase } from '@engine/compiler/phases/types'

export class LexerPhase implements CompilerPhase {
  public run(context: CompilerContext, artifacts: PipelineArtifacts): void {
    artifacts.tokens = LexerFactory.create(context.source, context.plugin).tokenize()
  }
}
