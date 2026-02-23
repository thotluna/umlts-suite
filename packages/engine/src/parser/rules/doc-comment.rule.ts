import { TokenType } from '@engine/syntax/token.types'
import type { StatementNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { StatementRule, Orchestrator } from '@engine/parser/rule.types'

export class DocCommentRule implements StatementRule {
  public canHandle(context: IParserHub): boolean {
    return context.check(TokenType.DOC_COMMENT)
  }

  public parse(context: IParserHub, _orchestrator: Orchestrator): StatementNode[] {
    if (context.match(TokenType.DOC_COMMENT)) {
      context.setPendingDocs(context.prev().value)
      return []
    }
    return []
  }
}
