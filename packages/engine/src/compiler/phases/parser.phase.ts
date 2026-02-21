import { ParserFactory } from '../../parser/parser.factory'
import type { CompilerContext } from './context'
import { CompilerPhase } from './types'

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
