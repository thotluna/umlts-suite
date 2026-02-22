import { TokenType } from '../../../../syntax/token.types'
import type { MemberNode } from '../../../../syntax/nodes'
import type { IParserHub } from '../../../core/parser.hub'
import { ConstraintRule } from '../../constraint.rule'
import type { IMemberProvider } from '../member-strategy.interface'

export class ConstraintMemberProvider implements IMemberProvider {
  canHandle(context: IParserHub): boolean {
    return context.check(TokenType.LBRACE)
  }

  parse(context: IParserHub): MemberNode | null {
    return ConstraintRule.parseInline(context)
  }
}
