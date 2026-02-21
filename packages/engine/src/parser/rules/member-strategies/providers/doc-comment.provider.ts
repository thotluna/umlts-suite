import { TokenType } from '../../../../syntax/token.types'
import type { ParserContext } from '../../../parser.context'
import type { IMemberProvider } from '../member-strategy.interface'
import type { MemberNode } from '../../../../syntax/nodes'

export class DocCommentProvider implements IMemberProvider {
  canHandle(context: ParserContext): boolean {
    return context.check(TokenType.DOC_COMMENT)
  }

  parse(context: ParserContext): MemberNode | null {
    const token = context.consume(TokenType.DOC_COMMENT, '')
    context.setPendingDocs(token.value)
    return null
  }
}
