import { LexerFactory } from '../lexer/lexer.factory'
import { ParserFactory } from '../parser/parser.factory'
import { ParserContext } from '../parser/parser.context'
import { DiagnosticReporter } from '../parser/diagnostic-reporter'
import type { CompilerContext } from './context'

export interface CompilerPhase {
  run(context: CompilerContext): Promise<void> | void
}

export class LexerPhase implements CompilerPhase {
  public run(context: CompilerContext): void {
    const lexer = LexerFactory.create(context.source, context.activePlugin)
    context.tokens = lexer.tokenize()
  }
}

export class ParserPhase implements CompilerPhase {
  public run(context: CompilerContext): void {
    const parser = ParserFactory.create()
    const result = parser.parse(context.tokens, context.activePlugin)

    context.ast = result
    if (result.diagnostics) {
      context.addDiagnostics(result.diagnostics)
    }
  }
}

export class SemanticPhase implements CompilerPhase {
  public async run(context: CompilerContext): Promise<void> {
    if (!context.ast) return

    const reporter = new DiagnosticReporter()
    const parserContext = new ParserContext(
      context.tokens,
      reporter,
      context.activePlugin,
    )

    context.diagram = await context.analyzer.analyze(context.ast, parserContext)
    context.addDiagnostics(reporter.getDiagnostics())
  }
}
