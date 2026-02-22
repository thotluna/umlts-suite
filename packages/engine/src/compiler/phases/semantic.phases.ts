import { DiagnosticReporter } from '../../parser/diagnostic-reporter'
import { ParserHub } from '../../parser/parser.hub'
import { SemanticAnalyzer } from '../../semantics/analyzer'
import type { CompilerContext } from './context'
import type { PipelineArtifacts } from './pipeline-artifacts'
import type { CompilerPhase } from './types'

export class SemanticPhase implements CompilerPhase {
  constructor(private readonly analyzer: SemanticAnalyzer) {}

  public run(context: CompilerContext, artifacts: PipelineArtifacts): void {
    if (!artifacts.ast || !artifacts.tokens) return

    // Creamos un contexto limpio para el análisis semántico coordinado por el ParserHub
    const reporter = new DiagnosticReporter()
    const parserContext = new ParserHub(artifacts.tokens, reporter)

    artifacts.diagram = this.analyzer.analyze(artifacts.ast, parserContext)

    if (parserContext.hasErrors()) {
      context.addDiagnostics(parserContext.getDiagnostics())
    }
  }
}
