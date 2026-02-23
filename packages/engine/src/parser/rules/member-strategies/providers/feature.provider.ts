import { TokenType } from '../../../../syntax/token.types'
import type { MemberNode } from '../../../../syntax/nodes'
import type { IParserHub } from '../../../core/parser.hub'
import { AttributeRule } from '../../attribute.rule'
import { MethodRule } from '../../method.rule'
import { ModifierRule } from '../../modifier.rule'
import type { IMemberProvider } from '../../../core/member-provider.interface'
import { Orchestrator } from '../../../rule.types'

export class FeatureMemberProvider implements IMemberProvider {
  private readonly attributeRule = new AttributeRule()
  private readonly methodRule = new MethodRule()

  canHandle(context: IParserHub): boolean {
    const type = context.peek().type
    return this.isVisibility(type) || ModifierRule.isModifier(type) || type === TokenType.IDENTIFIER
  }

  parse(context: IParserHub, orchestrator: Orchestrator): MemberNode | null {
    const visibility = this.parseVisibility(context)
    const modifiers = ModifierRule.parse(context)
    const nameToken = context.consume(TokenType.IDENTIFIER, 'Expected member name')

    if (context.check(TokenType.LPAREN)) {
      return this.methodRule.parse(context, nameToken, visibility, modifiers, orchestrator)
    } else {
      return this.attributeRule.parse(context, nameToken, visibility, modifiers, orchestrator)
    }
  }

  private isVisibility(type: TokenType): boolean {
    return [
      TokenType.VIS_PUB,
      TokenType.VIS_PRIV,
      TokenType.VIS_PROT,
      TokenType.VIS_PACK,
      TokenType.KW_PUBLIC,
      TokenType.KW_PRIVATE,
      TokenType.KW_PROTECTED,
      TokenType.KW_INTERNAL,
    ].includes(type)
  }

  private parseVisibility(context: IParserHub): string {
    if (this.isVisibility(context.peek().type)) {
      return context.advance().value
    }
    return 'public'
  }
}
