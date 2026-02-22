import { TokenType } from '../../../../syntax/token.types'
import { ASTNodeType, type MemberNode } from '../../../../syntax/nodes'
import type { IParserHub } from '../../../parser.hub'
import type { IMemberProvider } from '../member-strategy.interface'

export class CommentProvider implements IMemberProvider {
  canHandle(context: IParserHub): boolean {
    return context.check(TokenType.COMMENT)
  }

  parse(context: IParserHub): MemberNode | null {
    const token = context.consume(TokenType.COMMENT, '')
    return {
      type: ASTNodeType.COMMENT,
      value: token.value,
      line: token.line,
      column: token.column,
    }
  }
}
