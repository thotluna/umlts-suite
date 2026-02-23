import { TokenType } from '../../../../syntax/token.types'
import { ASTNodeType, type MemberNode } from '../../../../syntax/nodes'
import type { IParserHub } from '../../../core/parser.hub'
import type { IMemberProvider } from '../../../core/member-provider.interface'
import { Orchestrator } from '../../../rule.types'

export class CommentProvider implements IMemberProvider {
  canHandle(context: IParserHub): boolean {
    return context.check(TokenType.COMMENT)
  }

  parse(context: IParserHub, _orchestrator: Orchestrator): MemberNode | null {
    const token = context.consume(TokenType.COMMENT, '')
    return {
      type: ASTNodeType.COMMENT,
      value: token.value,
      line: token.line,
      column: token.column,
    }
  }
}
