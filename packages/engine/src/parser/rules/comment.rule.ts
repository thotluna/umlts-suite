import { TokenType } from '../../syntax/token.types'
import type { StatementNode } from '../../syntax/nodes'
import { ASTNodeType } from '../../syntax/nodes'
import type { IParserHub } from '../parser.context'
import type { StatementRule, Orchestrator } from '../rule.types'

export class CommentRule implements StatementRule {
  public canStart(context: IParserHub): boolean {
    return context.check(TokenType.COMMENT)
  }

  public parse(context: IParserHub, _orchestrator: Orchestrator): StatementNode[] {
    if (context.check(TokenType.COMMENT)) {
      const token = context.consume(TokenType.COMMENT, '')
      return [
        {
          type: ASTNodeType.COMMENT,
          value: token.value,
          line: token.line,
          column: token.column,
        },
      ]
    }
    return []
  }
}
