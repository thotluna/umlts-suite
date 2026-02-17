import { TokenType } from '../../syntax/token.types'
import type { StatementNode } from '../../syntax/nodes'
import type { ParserContext } from '../parser.context'
import type { StatementRule, Orchestrator } from '../rule.types'

export class DocCommentRule implements StatementRule {
  public canStart(context: ParserContext): boolean {
    return context.check(TokenType.DOC_COMMENT)
  }

  public parse(context: ParserContext, _orchestrator: Orchestrator): StatementNode[] {
    if (context.match(TokenType.DOC_COMMENT)) {
      context.setPendingDocs(context.prev().value)
      return []
    }
    return []
  }
}
