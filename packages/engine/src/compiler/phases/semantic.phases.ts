import { ParserContext } from '../../parser/parser.context'
import { DiagnosticReporter } from '../../parser/diagnostic-reporter'
import type { CompilerContext } from './context'
import { CompilerPhase } from './types'

export class SemanticPhase implements CompilerPhase {
  public async run(context: CompilerContext): Promise<void> {
    if (!context.ast) return

    const reporter = new DiagnosticReporter()
    const parserContext = new ParserContext(context.tokens, reporter, context.activePlugin)

    context.diagram = context.analyzer.analyze(context.ast, parserContext)
    context.addDiagnostics(reporter.getDiagnostics())
  }
}
