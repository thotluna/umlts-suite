import { ParserFactory } from '@engine/parser/parser.factory'
import type { CompilerContext } from '@engine/compiler/phases/context'
import type { PipelineArtifacts } from '@engine/compiler/phases/pipeline-artifacts'
import type { CompilerPhase } from '@engine/compiler/phases/types'

export class ParserPhase implements CompilerPhase {
  public run(context: CompilerContext, artifacts: PipelineArtifacts): void {
    // We pass the language extension to the factory
    const result = ParserFactory.create(context.registry.language).parse(artifacts.tokens)
    artifacts.ast = result
    if (result.diagnostics) {
      context.addDiagnostics(result.diagnostics)
    }
  }
}
