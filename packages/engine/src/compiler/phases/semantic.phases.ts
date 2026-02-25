import type { CompilerContext } from '@engine/compiler/phases/context'
import type { PipelineArtifacts } from '@engine/compiler/phases/pipeline-artifacts'
import type { CompilerPhase } from '@engine/compiler/phases/types'
import { SemanticAnalyzer } from '@engine/semantics/analyzer'

export class SemanticPhase implements CompilerPhase {
  private readonly analyzer: SemanticAnalyzer = new SemanticAnalyzer()

  public run(context: CompilerContext, artifacts: PipelineArtifacts): void {
    if (!artifacts.ast) return

    // Pass the context directly as it implements ISemanticContext
    artifacts.diagram = this.analyzer.analyze(artifacts.ast, context)
  }
}
