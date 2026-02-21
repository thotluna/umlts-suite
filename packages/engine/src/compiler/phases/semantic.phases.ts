import { DiagnosticReporter } from '../../parser/diagnostic-reporter'
<<<<<<< HEAD
import { ParserHub } from '../../parser/parser.hub'
import type { Phase, PhaseArtifacts } from './phase.interface'
import type { SemanticAnalyzer } from '../../semantics/analyzer'

export class SemanticPhase implements Phase {
  constructor(private readonly analyzer: SemanticAnalyzer) {}

  public async run(artifacts: PhaseArtifacts): Promise<void> {
    if (!artifacts.ast || !artifacts.tokens) {
      throw new Error('SemanticPhase required AST and Tokens')
    }

    // Creamos un contexto limpio para el análisis semántico coordinado por el ParserHub
    const reporter = new DiagnosticReporter()
    const parserContext = new ParserHub(artifacts.tokens, reporter)

    artifacts.diagram = this.analyzer.analyze(artifacts.ast, parserContext)

    if (parserContext.hasErrors()) {
      artifacts.diagnostics = parserContext.getDiagnostics()
    }
=======
import type { CompilerContext } from './context'
import type { PipelineArtifacts } from './pipeline-artifacts'
import type { CompilerPhase } from './types'
import { SemanticAnalyzer } from '../../semantics/analyzer'
import type { PluginManager } from '../../plugins/plugin-manager'

export class SemanticPhase implements CompilerPhase {
  private readonly analyzer: SemanticAnalyzer

  constructor(pluginManager: PluginManager) {
    this.analyzer = new SemanticAnalyzer(pluginManager)
  }

  public run(context: CompilerContext, artifacts: PipelineArtifacts): void {
    if (!artifacts.ast) return
    const reporter = new DiagnosticReporter()
    const parserContext = new ParserContext(artifacts.tokens, reporter, context.plugin)
    artifacts.diagram = this.analyzer.analyze(artifacts.ast, parserContext)
    context.addDiagnostics(reporter.getDiagnostics())
>>>>>>> d561832 (Refactor: Split compiler state into PipelineArtifacts and make pipeline synchronous)
  }
}
