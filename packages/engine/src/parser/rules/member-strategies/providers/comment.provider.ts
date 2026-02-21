import { TokenType } from '../../../../syntax/token.types'
import { ASTNodeType, type MemberNode } from '../../../../syntax/nodes'
import type { ParserContext } from '../../../parser.context'
import type { IMemberProvider } from '../member-strategy.interface'

export class CommentProvider implements IMemberProvider {
  canHandle(context: ParserContext): boolean {
    return context.check(TokenType.COMMENT)
  }

  parse(context: ParserContext): MemberNode | null {
    const token = context.consume(TokenType.COMMENT, '')
    return {
      type: ASTNodeType.COMMENT,
      value: token.value,
      line: token.line,
      column: token.column,
    }
  }
}
