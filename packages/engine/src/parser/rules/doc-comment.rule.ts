import { TokenType } from '../../syntax/token.types'
import type { StatementNode } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import type { StatementRule, Orchestrator } from '../rule.types'

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
