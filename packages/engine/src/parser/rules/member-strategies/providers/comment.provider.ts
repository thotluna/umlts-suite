import { TokenType } from '@engine/syntax/token.types'
import { ASTNodeType, type MemberNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { IMemberProvider } from '@engine/parser/core/member-provider.interface'
import { Orchestrator } from '@engine/parser/rule.types'

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
