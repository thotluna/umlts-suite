import { DiagnosticReporter } from '@engine/core/diagnostics/diagnostic-reporter'
import type { CompilerContext } from '@engine/compiler/phases/context'
import type { PipelineArtifacts } from '@engine/compiler/phases/pipeline-artifacts'
import type { CompilerPhase } from '@engine/compiler/phases/types'
import { SemanticAnalyzer } from '@engine/semantics/analyzer'
import type { PluginManager } from '@engine/plugins/plugin-manager'

export class SemanticPhase implements CompilerPhase {
  private readonly analyzer: SemanticAnalyzer

  constructor(pluginManager: PluginManager) {
    this.analyzer = new SemanticAnalyzer(pluginManager)
  }

  public run(context: CompilerContext, artifacts: PipelineArtifacts): void {
    if (!artifacts.ast) return
    const reporter = new DiagnosticReporter()

    artifacts.diagram = this.analyzer.analyze(artifacts.ast, reporter)
    context.addDiagnostics(reporter.getDiagnostics())
  }
}
