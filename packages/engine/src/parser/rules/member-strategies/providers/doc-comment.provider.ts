import { TokenType } from '../../../../syntax/token.types'
import type { IParserHub } from '../../../core/parser.hub'
import type { IMemberProvider } from '../../../core/member-provider.interface'
import type { MemberNode } from '../../../../syntax/nodes'

export class DocCommentProvider implements IMemberProvider {
  canHandle(context: IParserHub): boolean {
    return context.check(TokenType.DOC_COMMENT)
  }

  parse(context: IParserHub): MemberNode | null {
    const token = context.consume(TokenType.DOC_COMMENT, '')
    context.setPendingDocs(token.value)
    return null
  }
}
