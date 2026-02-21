import { TokenType } from '../../syntax/token.types'
import type { StatementNode } from '../../syntax/nodes'
import type { IParserHub } from '../parser.context'
import type { StatementRule, IOrchestrator } from '../rule.types'

export class DocCommentRule implements StatementRule {
  public canStart(context: IParserHub): boolean {
    return context.check(TokenType.DOC_COMMENT)
  }

  public parse(context: IParserHub, _orchestrator: IOrchestrator): StatementNode[] {
    if (context.match(TokenType.DOC_COMMENT)) {
      context.setPendingDocs(context.prev().value)
      return []
    }
    return []
  }
}
