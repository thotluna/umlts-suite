import { LexerFactory } from '../../lexer/lexer.factory'
import type { CompilerContext } from './context'
import { CompilerPhase } from './types'

export class LexerPhase implements CompilerPhase {
  public run(context: CompilerContext): void {
    const lexer = LexerFactory.create(context.source, context.activePlugin)
    context.tokens = lexer.tokenize()
  }
}
