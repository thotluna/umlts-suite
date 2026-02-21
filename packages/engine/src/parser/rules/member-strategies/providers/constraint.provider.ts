import { TokenType } from '../../../../syntax/token.types'
import type { MemberNode } from '../../../../syntax/nodes'
import type { ParserContext } from '../../../parser.context'
import { ConstraintRule } from '../../constraint.rule'
import type { IMemberProvider } from '../member-strategy.interface'

export class ConstraintMemberProvider implements IMemberProvider {
  canHandle(context: ParserContext): boolean {
    return context.check(TokenType.LBRACE)
  }

  parse(context: ParserContext): MemberNode | null {
    return ConstraintRule.parseInline(context)
  }
}
