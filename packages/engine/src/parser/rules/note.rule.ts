import { TokenType } from '@engine/syntax/token.types'
import { type StatementNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { StatementRule, Orchestrator } from '@engine/parser/rule.types'
import { ASTFactory } from '@engine/parser/factory/ast.factory'

export class NoteRule implements StatementRule {
  public canHandle(context: IParserHub): boolean {
    return context.check(TokenType.KW_NOTE) || context.check(TokenType.STRING)
  }

  public parse(context: IParserHub, _orchestrator: Orchestrator): StatementNode[] {
    const startToken = context.peek()

    if (context.match(TokenType.KW_NOTE)) {
      context.match(TokenType.COLON)
      const textToken = context.consume(TokenType.STRING, "Expected string literal after 'note'")

      let id: string | undefined
      const next = context.peek()
      if (next.type === TokenType.IDENTIFIER && next.value === 'as') {
        context.advance()
        id = context.consume(TokenType.IDENTIFIER, "Expected identifier after 'as'").value
      }

      return [ASTFactory.createNote(textToken.value, startToken.line, startToken.column, id)]
    }

    if (context.match(TokenType.STRING)) {
      return [ASTFactory.createNote(context.prev().value, startToken.line, startToken.column)]
    }

    return []
  }
}
