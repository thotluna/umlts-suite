import { ParserFactory } from '../../parser/parser.factory'
import type { CompilerContext } from './context'
import type { PipelineArtifacts } from './pipeline-artifacts'
import type { CompilerPhase } from './types'

export class ParserPhase implements CompilerPhase {
  public run(context: CompilerContext, artifacts: PipelineArtifacts): void {
    const result = ParserFactory.create().parse(artifacts.tokens, context.plugin)
    artifacts.ast = result
    if (result.diagnostics) {
      context.addDiagnostics(result.diagnostics)
    }
  }
}
