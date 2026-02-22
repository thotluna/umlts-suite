import { TokenType } from '../../syntax/token.types'
import { ASTNodeType, type StatementNode, type NoteNode } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import type { StatementRule, Orchestrator } from '../rule.types'

export class NoteRule implements StatementRule {
  public canStart(context: IParserHub): boolean {
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

      return [
        {
          type: ASTNodeType.NOTE,
          value: textToken.value,
          id,
          line: startToken.line,
          column: startToken.column,
        } as NoteNode,
      ]
    }

    if (context.match(TokenType.STRING)) {
      return [
        {
          type: ASTNodeType.NOTE,
          value: context.prev().value,
          line: startToken.line,
          column: startToken.column,
        } as NoteNode,
      ]
    }

    return []
  }
}
