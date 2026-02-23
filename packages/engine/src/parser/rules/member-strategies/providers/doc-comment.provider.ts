import { TokenType } from '@engine/syntax/token.types'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { IMemberProvider } from '@engine/parser/core/member-provider.interface'
import type { MemberNode } from '@engine/syntax/nodes'
import { Orchestrator } from '@engine/parser/rule.types'

export class DocCommentProvider implements IMemberProvider {
  canHandle(context: IParserHub): boolean {
    return context.check(TokenType.DOC_COMMENT)
  }

  parse(context: IParserHub, _orchestrator: Orchestrator): MemberNode | null {
    const token = context.consume(TokenType.DOC_COMMENT, '')
    context.setPendingDocs(token.value)
    return null
  }
}
