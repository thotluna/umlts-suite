import { TokenType } from '../../syntax/token.types'
import { type StatementNode } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import type { StatementRule, Orchestrator } from '../rule.types'
import { ASTFactory } from '../factory/ast.factory'

export class CommentRule implements StatementRule {
  public canStart(context: IParserHub): boolean {
    return context.check(TokenType.COMMENT)
  }

  public parse(context: IParserHub, _orchestrator: Orchestrator): StatementNode[] {
    if (context.check(TokenType.COMMENT)) {
      const token = context.consume(TokenType.COMMENT, '')
      return [ASTFactory.createComment(token.value, token.line, token.column)]
    }
    return []
  }
}
