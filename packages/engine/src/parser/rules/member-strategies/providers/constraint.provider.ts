import { TokenType } from '@engine/syntax/token.types'
import type { MemberNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import { ConstraintRule } from '@engine/parser/rules/constraint.rule'
import type { IMemberProvider } from '@engine/parser/core/member-provider.interface'
import { Orchestrator } from '@engine/parser/rule.types'

export class ConstraintMemberProvider implements IMemberProvider {
  canHandle(context: IParserHub): boolean {
    return context.check(TokenType.LBRACE)
  }

  parse(context: IParserHub, _orchestrator: Orchestrator): MemberNode | null {
    return ConstraintRule.parseInline(context)
  }
}
