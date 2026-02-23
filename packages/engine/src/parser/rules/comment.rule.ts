import { TokenType } from '@engine/syntax/token.types'
import { type StatementNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { StatementRule, Orchestrator } from '@engine/parser/rule.types'
import { ASTFactory } from '@engine/parser/factory/ast.factory'

export class CommentRule implements StatementRule {
  public canHandle(context: IParserHub): boolean {
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
