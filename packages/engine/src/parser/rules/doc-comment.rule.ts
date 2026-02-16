import { TokenType } from '../../lexer/token.types'
import type { ParserContext } from '../parser.context'
import type { StatementRule } from '../rule.types'

export class DocCommentRule implements StatementRule {
  public canStart(context: ParserContext): boolean {
    return context.check(TokenType.DOC_COMMENT)
  }

  public parse(context: ParserContext): [] | null {
    if (context.match(TokenType.DOC_COMMENT)) {
      context.setPendingDocs(context.prev().value)
      return []
    }
    return null
  }
}
