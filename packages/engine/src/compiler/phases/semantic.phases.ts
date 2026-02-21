import { DiagnosticReporter } from '../../parser/diagnostic-reporter'
import { ParserHub } from '../../parser/parser.hub'
import type { IParserHub } from '../../parser/parser.context'
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
  }
}
